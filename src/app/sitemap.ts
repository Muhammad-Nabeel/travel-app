import type { MetadataRoute } from "next";

import { getStoredVisaCountries } from "@/lib/admin-settings/visa-settings";
import { getPublishedBlogPosts } from "@/lib/blog";
import { BLOG_CATEGORIES, getBlogCategoryPath } from "@/lib/blog-categories";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { getActivityHref } from "@/lib/activity-href";
import { absoluteUrl } from "@/lib/seo";
import {
    CATALOG_INDEXING,
    STATIC_PAGE_SEO,
    type StaticPageKey,
} from "@/lib/seo-copy";
import { tourPackageResults } from "@/lib/mock-data";
import { getTourPackagePath } from "@/lib/tour-packages";
import { getPublishedUmrahPackages, getUmrahPackagePath } from "@/lib/umrah-packages";
import { getVisaPath } from "@/lib/visa";

// The sitemap must list exactly the indexable URLs: anything rendered with
// noindex is left out, otherwise Search Console reports "Submitted URL marked
// noindex". lastModified is only set where a real content date exists;
// a constant "now" teaches Google to ignore the field.

export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

const STATIC_PRIORITY: Partial<Record<StaticPageKey, number>> = {
    home: 1,
    umrahPackages: 0.9,
    flights: 0.9,
    visa: 0.8,
    blog: 0.8,
    tourPackages: 0.8,
    hotels: 0.7,
    activities: 0.7,
};

function latest(dates: Array<Date | string | null | undefined>) {
    const times = dates
        .map((value) => (value ? new Date(value).getTime() : NaN))
        .filter((time) => Number.isFinite(time));
    return times.length > 0 ? new Date(Math.max(...times)) : undefined;
}

async function getDatabaseEntries(): Promise<SitemapEntry[]> {
    if (shouldBypassDatabase()) {
        return [];
    }

    try {
        const [destinations, activities] = await Promise.all([
            prisma.destination.findMany({
                where: { isActive: true },
                select: { id: true, slug: true, updatedAt: true, imageUrl: true },
            }),
            prisma.activity.findMany({
                where: { isActive: true },
                select: { id: true, slug: true, updatedAt: true, imageUrl: true },
            }),
        ]);

        return [
            ...destinations.map((destination) => ({
                url: absoluteUrl(
                    `/destinations/${destination.slug?.trim() ? destination.slug : destination.id}`,
                ),
                lastModified: destination.updatedAt,
                changeFrequency: "monthly" as const,
                priority: 0.7,
                images: destination.imageUrl ? [destination.imageUrl] : undefined,
            })),
            ...activities.map((activity) => ({
                url: absoluteUrl(getActivityHref(activity)),
                lastModified: activity.updatedAt,
                changeFrequency: "monthly" as const,
                priority: 0.6,
                images: activity.imageUrl ? [activity.imageUrl] : undefined,
            })),
        ];
    } catch (error) {
        markDatabaseUnavailable(error);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [posts, umrah, visas, databaseEntries] = await Promise.all([
        getPublishedBlogPosts(),
        getPublishedUmrahPackages(),
        getStoredVisaCountries(),
        getDatabaseEntries(),
    ]);

    const excluded = new Set<StaticPageKey>();
    if (!CATALOG_INDEXING.hotels) excluded.add("hotels");
    if (!CATALOG_INDEXING.tourPackages) excluded.add("tourPackages");
    if (umrah.isDummy) excluded.add("umrahPackages");

    const contentDates: Partial<Record<StaticPageKey, Date | undefined>> = {
        blog: latest(posts.map((post) => post.updatedAt)),
        umrahPackages: umrah.isDummy
            ? undefined
            : latest(umrah.packages.map((pkg) => pkg.updatedAt)),
    };

    const staticEntries: SitemapEntry[] = (
        Object.entries(STATIC_PAGE_SEO) as Array<[StaticPageKey, (typeof STATIC_PAGE_SEO)[StaticPageKey]]>
    )
        .filter(([key]) => !excluded.has(key))
        .map(([key, page]) => ({
            url: absoluteUrl(page.path),
            lastModified: contentDates[key],
            priority: STATIC_PRIORITY[key] ?? 0.5,
        }));

    const blogEntries: SitemapEntry[] = posts.map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.updatedAt,
        priority: 0.7,
        images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    }));

    // Category hubs are only indexable once they contain an article.
    const categoryEntries: SitemapEntry[] = Object.keys(BLOG_CATEGORIES)
        .map((category) => {
            const inCategory = posts.filter((post) => post.category === category);
            if (inCategory.length === 0) return null;
            return {
                url: absoluteUrl(getBlogCategoryPath(category)),
                lastModified: latest(inCategory.map((post) => post.updatedAt)),
                priority: 0.6,
            };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    const umrahEntries: SitemapEntry[] = umrah.isDummy
        ? []
        : umrah.packages.map((pkg) => ({
            url: absoluteUrl(getUmrahPackagePath(pkg.slug)),
            lastModified: pkg.updatedAt,
            changeFrequency: "weekly",
            priority: 0.8,
        }));

    const visaEntries: SitemapEntry[] = visas
        .filter((visa) => visa.isActive)
        .map((visa) => ({
            url: absoluteUrl(getVisaPath(visa.country, visa.visaType)),
            priority: 0.7,
        }));

    const tourEntries: SitemapEntry[] = CATALOG_INDEXING.tourPackages
        ? tourPackageResults.map((pkg) => ({
            url: absoluteUrl(getTourPackagePath(pkg.title)),
            priority: 0.7,
        }))
        : [];

    return [
        ...staticEntries,
        ...umrahEntries,
        ...visaEntries,
        ...tourEntries,
        ...categoryEntries,
        ...blogEntries,
        ...databaseEntries,
    ];
}
