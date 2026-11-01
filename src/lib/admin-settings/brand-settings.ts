import { cache } from "react";

import { getStoredMediaSettings } from "@/lib/admin-settings/media-settings";
import {
    sanitizeBrandAssets,
    sanitizeFooterBadges,
    type BrandAssets,
    type FooterBadge,
} from "@/lib/brand-assets";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { SITE_NAME } from "@/lib/seo";

export type BrandSettings = {
    name: string;
    logoUrl: string | null;
    /** R2 object key of the uploaded logo, used to delete it when replaced. */
    logoKey: string | null;
    /** Service icons, favicon and empty-state images from Admin → Media. */
    assets: BrandAssets;
    /** Payment and accreditation badges in the footer, in display order. */
    footerBadges: FooterBadge[];
};

/** What the browser needs; the storage key stays on the server. */
export type PublicBrand = Pick<BrandSettings, "name" | "logoUrl" | "assets" | "footerBadges">;

const BRAND_SETTINGS_KEY = "brand_settings";

function sanitizeName(value: unknown): string {
    return typeof value === "string" ? value.trim().slice(0, 60) : "";
}

function sanitizeOptional(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function defaultBrandSettings(): BrandSettings {
    return { name: SITE_NAME, logoUrl: null, logoKey: null, assets: {}, footerBadges: [] };
}

async function readBrandSettings(): Promise<BrandSettings> {
    if (shouldBypassDatabase()) {
        return defaultBrandSettings();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: BRAND_SETTINGS_KEY },
            select: { value: true },
        });
        const parsed = row?.value
            ? (JSON.parse(row.value) as Partial<BrandSettings>)
            : {};
        const logoUrl = sanitizeOptional(parsed.logoUrl);

        return {
            name: sanitizeName(parsed.name) || SITE_NAME,
            // Logos uploaded before brand settings existed live in media settings.
            logoUrl: logoUrl ?? (await getStoredMediaSettings()).websiteLogo,
            logoKey: logoUrl ? sanitizeOptional(parsed.logoKey) : null,
            assets: sanitizeBrandAssets(parsed.assets),
            footerBadges: sanitizeFooterBadges(parsed.footerBadges),
        };
    } catch (err) {
        markDatabaseUnavailable(err);
        return defaultBrandSettings();
    }
}

/** Brand name and logo, read once per request. */
export const getStoredBrandSettings = cache(readBrandSettings);

export async function getPublicBrand(): Promise<PublicBrand> {
    const { name, logoUrl, assets, footerBadges } = await getStoredBrandSettings();
    return { name, logoUrl, assets, footerBadges };
}

export async function saveStoredBrandSettings(
    input: Partial<BrandSettings>,
): Promise<BrandSettings> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving brand settings.");
    }

    const current = await readBrandSettings();
    const payload: BrandSettings = {
        name: input.name === undefined ? current.name : sanitizeName(input.name) || SITE_NAME,
        logoUrl: input.logoUrl === undefined ? current.logoUrl : sanitizeOptional(input.logoUrl),
        logoKey: input.logoKey === undefined ? current.logoKey : sanitizeOptional(input.logoKey),
        assets: input.assets === undefined ? current.assets : sanitizeBrandAssets(input.assets),
        footerBadges:
            input.footerBadges === undefined
                ? current.footerBadges
                : sanitizeFooterBadges(input.footerBadges),
    };

    await prisma.adminSetting.upsert({
        where: { key: BRAND_SETTINGS_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: BRAND_SETTINGS_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}
