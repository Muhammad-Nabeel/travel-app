import { NextRequest, NextResponse } from "next/server";

import {
    getStoredPageBanners,
    savePageBanner,
} from "@/lib/admin-settings/page-banner-settings";
import { BUILT_IN_PAGE_BANNERS, isPageBannerSlot } from "@/lib/page-banners";
import { revalidatePublicSite } from "@/lib/revalidate-site";

function errorResponse(err: unknown, status = 500) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status });
}

function isMediaLibraryUrl(url: string): boolean {
    const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/+$/, "");
    return Boolean(publicBase) && url.startsWith(`${publicBase}/`);
}

export async function GET() {
    try {
        return NextResponse.json({ banners: await getStoredPageBanners() });
    } catch (err) {
        return errorResponse(err);
    }
}

/**
 * Sets one page's banner (`{ slot, url }`) to an image in the R2 media library,
 * or back to the built-in photo when url is null.
 */
export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as { slot?: string; url?: string | null };

        if (!isPageBannerSlot(body.slot)) {
            return errorResponse(new Error("Unknown page banner."), 400);
        }
        if (body.url && !isMediaLibraryUrl(body.url)) {
            return errorResponse(new Error("Choose an image from the media library."), 400);
        }

        const banners = await savePageBanner(body.slot, body.url || BUILT_IN_PAGE_BANNERS[body.slot]);
        revalidatePublicSite();
        return NextResponse.json({ banners });
    } catch (err) {
        return errorResponse(err);
    }
}
