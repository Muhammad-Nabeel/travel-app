import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
    getStoredBrandSettings,
    saveStoredBrandSettings,
    type BrandSettings,
} from "@/lib/admin-settings/brand-settings";
import { saveStoredMediaSettings } from "@/lib/admin-settings/media-settings";
import { isBrandAssetSlot, type FooterBadge } from "@/lib/brand-assets";
import { isPassthroughImage, optimizeImage } from "@/lib/media/optimize-image";
import { deleteFromR2, isR2Configured, uploadToR2 } from "@/lib/storage/r2";

const LOGO_TYPES: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
};
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function toResponse(settings: BrandSettings) {
    return {
        name: settings.name,
        logoUrl: settings.logoUrl,
        assets: settings.assets,
        footerBadges: settings.footerBadges,
    };
}

function errorResponse(err: unknown, status = 500) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status });
}

// Brand appears in the root layout, so every cached page must re-render.
function revalidateSite() {
    revalidatePath("/", "layout");
}

async function deleteOldLogo(key: string | null) {
    if (!key) return;
    try {
        await deleteFromR2(key);
    } catch (err) {
        console.error("[brand] Failed to delete old logo from R2", err);
    }
}

export async function GET() {
    try {
        return NextResponse.json(toResponse(await getStoredBrandSettings()));
    } catch (err) {
        return errorResponse(err);
    }
}

function isMediaLibraryUrl(url: string): boolean {
    const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/+$/, "");
    return Boolean(publicBase) && url.startsWith(`${publicBase}/`);
}

/**
 * Updates the brand name, selects an image already in the R2 media library as
 * the logo, or sets/clears one brand asset slot (`{ asset, url }`, url null to
 * clear), or replaces the footer badge list (`{ footerBadges }`). Library
 * images are not deleted when the selection changes later.
 */
export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            name?: string;
            logoUrl?: string;
            asset?: string;
            url?: string | null;
            footerBadges?: Partial<FooterBadge>[];
        };

        if (body.footerBadges !== undefined) {
            if (!Array.isArray(body.footerBadges)) {
                return errorResponse(new Error("Footer badges must be a list."), 400);
            }
            for (const badge of body.footerBadges) {
                if (!badge.label?.trim()) {
                    return errorResponse(new Error("Every footer badge needs a label."), 400);
                }
                if (!badge.url || !isMediaLibraryUrl(badge.url)) {
                    return errorResponse(new Error("Choose footer badges from the media library."), 400);
                }
            }

            const saved = await saveStoredBrandSettings({
                footerBadges: body.footerBadges as FooterBadge[],
            });
            revalidateSite();
            return NextResponse.json(toResponse(saved));
        }

        if (body.asset !== undefined) {
            if (!isBrandAssetSlot(body.asset)) {
                return errorResponse(new Error("Unknown brand image."), 400);
            }
            if (body.url && !isMediaLibraryUrl(body.url)) {
                return errorResponse(new Error("Choose an image from the media library."), 400);
            }

            const { assets } = await getStoredBrandSettings();
            const next = { ...assets };
            if (body.url) next[body.asset] = body.url;
            else delete next[body.asset];

            const saved = await saveStoredBrandSettings({ assets: next });
            revalidateSite();
            return NextResponse.json(toResponse(saved));
        }

        if (body.logoUrl !== undefined) {
            if (!isMediaLibraryUrl(body.logoUrl)) {
                return errorResponse(new Error("Choose a logo from the media library."), 400);
            }

            const previous = await getStoredBrandSettings();
            const saved = await saveStoredBrandSettings({ logoUrl: body.logoUrl, logoKey: null });
            await deleteOldLogo(previous.logoKey);
            revalidateSite();
            return NextResponse.json(toResponse(saved));
        }

        if (!body.name?.trim()) {
            return errorResponse(new Error("Brand name is required."), 400);
        }

        const saved = await saveStoredBrandSettings({ name: body.name });
        revalidateSite();
        return NextResponse.json(toResponse(saved));
    } catch (err) {
        return errorResponse(err);
    }
}

/** Uploads a new logo to Cloudflare R2 and replaces the current one. */
export async function POST(request: NextRequest) {
    if (!isR2Configured()) {
        return errorResponse(
            new Error("Cloudflare R2 storage is not configured. Add the CLOUDFLARE_R2_* environment variables."),
            503,
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return errorResponse(new Error("Choose a logo file to upload."), 400);
        }

        const extension = LOGO_TYPES[file.type];
        if (!extension) {
            return errorResponse(new Error("The logo must be a PNG, JPG, WebP or SVG image."), 400);
        }

        if (file.size > MAX_LOGO_BYTES) {
            return errorResponse(new Error("The logo must be smaller than 2 MB."), 400);
        }

        const previous = await getStoredBrandSettings();
        const original = Buffer.from(await file.arrayBuffer());
        const logo = isPassthroughImage(file.type)
            ? { body: original, contentType: file.type, extension }
            : await optimizeImage(original, "logo");
        const key = `website/logo/${Date.now()}-${randomBytes(6).toString("hex")}.${logo.extension}`;
        const logoUrl = await uploadToR2(key, logo.body, logo.contentType);

        const saved = await saveStoredBrandSettings({ logoUrl, logoKey: key });
        await deleteOldLogo(previous.logoKey);
        revalidateSite();

        return NextResponse.json(toResponse(saved));
    } catch (err) {
        return errorResponse(err);
    }
}

/** Removes the logo; the site falls back to the brand name. */
export async function DELETE() {
    try {
        const previous = await getStoredBrandSettings();
        const saved = await saveStoredBrandSettings({ logoUrl: null, logoKey: null });
        // Also clear the legacy media-settings logo so it does not reappear.
        await saveStoredMediaSettings({ websiteLogo: null });
        await deleteOldLogo(previous.logoKey);
        revalidateSite();

        return NextResponse.json(toResponse(saved));
    } catch (err) {
        return errorResponse(err);
    }
}
