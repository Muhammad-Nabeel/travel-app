import type { MetadataRoute } from "next";

import { getPublishedBlogPosts } from "@/lib/blog";
import { prisma, shouldBypassDatabase } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

const STATIC_ROUTES: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
}> = [
        { path: "/", changeFrequency: "daily", priority: 1 },
        { path: "/about-us", changeFrequency: "monthly", priority: 0.7 },
        { path: "/activities", changeFrequency: "weekly", priority: 0.8 },
        { path: "/arrange-a-call", changeFrequency: "monthly", priority: 0.6 },
        { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
        { path: "/careers", changeFrequency: "weekly", priority: 0.5 },
        { path: "/contact-us", changeFrequency: "monthly", priority: 0.7 },
        { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.3 },
        { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
        { path: "/flights", changeFrequency: "daily", priority: 0.9 },
        { path: "/hotels", changeFrequency: "weekly", priority: 0.7 },
        { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
        { path: "/refund-policy", changeFrequency: "yearly", priority: 0.3 },
        { path: "/terms-conditions", changeFrequency: "yearly", priority: 0.3 },
        { path: "/tour-packages", changeFrequency: "weekly", priority: 0.7 },
        { path: "/umrah-packages", changeFrequency: "weekly", priority: 0.8 },
        { path: "/visa", changeFrequency: "weekly", priority: 0.7 },
    ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const posts = await getPublishedBlogPosts();

    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
        url: absoluteUrl(route.path),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
        images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    }));

    if (shouldBypassDatabase()) {
        return [...staticEntries, ...blogEntries];
    }

    try {
        const [destinations, activities] = await Promise.all([
            prisma.destination.findMany({
                where: { isActive: true },
                select: { id: true, slug: true, updatedAt: true, imageUrl: true },
            }),
            prisma.activity.findMany({
                where: { isActive: true },
                select: { id: true, updatedAt: true, imageUrl: true },
            }),
        ]);

        const destinationEntries: MetadataRoute.Sitemap = destinations.map(
            (destination) => ({
                url: absoluteUrl(
                    `/destinations/${destination.slug?.trim() ? destination.slug : destination.id}`,
                ),
                lastModified: destination.updatedAt,
                changeFrequency: "weekly",
                priority: 0.75,
                images: destination.imageUrl ? [destination.imageUrl] : undefined,
            }),
        );

        const activityEntries: MetadataRoute.Sitemap = activities.map(
            (activity) => ({
                url: absoluteUrl(`/activities/${activity.id}`),
                lastModified: activity.updatedAt,
                changeFrequency: "weekly",
                priority: 0.65,
                images: activity.imageUrl ? [activity.imageUrl] : undefined,
            }),
        );

        return [
            ...staticEntries,
            ...blogEntries,
            ...destinationEntries,
            ...activityEntries,
        ];
    } catch {
        return [...staticEntries, ...blogEntries];
    }
}