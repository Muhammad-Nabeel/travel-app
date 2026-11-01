import { cache } from "react";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import {
    BUILT_IN_PAGE_BANNERS,
    sanitizePageBanners,
    type PageBannerSlot,
    type PageBanners,
} from "@/lib/page-banners";

const PAGE_BANNERS_KEY = "page_banners";

async function readPageBanners(): Promise<PageBanners> {
    if (shouldBypassDatabase()) {
        return { ...BUILT_IN_PAGE_BANNERS };
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: PAGE_BANNERS_KEY },
            select: { value: true },
        });
        return sanitizePageBanners(row?.value ? JSON.parse(row.value) : {});
    } catch (err) {
        markDatabaseUnavailable(err);
        return { ...BUILT_IN_PAGE_BANNERS };
    }
}

/** Hero banner per page, read once per request. */
export const getStoredPageBanners = cache(readPageBanners);

export async function getPageBanner(slot: PageBannerSlot): Promise<string> {
    return (await getStoredPageBanners())[slot];
}

export async function savePageBanner(slot: PageBannerSlot, url: string): Promise<PageBanners> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving page banners.");
    }

    const payload = { ...(await readPageBanners()), [slot]: url };

    await prisma.adminSetting.upsert({
        where: { key: PAGE_BANNERS_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: PAGE_BANNERS_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}
