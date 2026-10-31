import { cache } from "react";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

// Server-side data for the home page carousels. Loading these during render
// (instead of fetching from the browser after hydration) puts the cards and
// their links in the HTML, so they are indexable and paint without waiting
// for JavaScript. Pages using them re-render with the root ISR window.

export const getActiveDestinations = cache(async () => {
    if (shouldBypassDatabase()) return [];

    try {
        return await prisma.destination.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                slug: true,
                city: true,
                country: true,
                scope: true,
                iataCode: true,
                imageUrl: true,
                fare: true,
                notes: true,
                gradient: true,
            },
        });
    } catch (error) {
        markDatabaseUnavailable(error);
        return [];
    }
});

export const getActiveActivities = cache(async () => {
    if (shouldBypassDatabase()) return [];

    try {
        return await prisma.activity.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                slug: true,
                title: true,
                category: true,
                description: true,
                imageUrl: true,
                cost: true,
                reviews: true,
                reviewCount: true,
            },
        });
    } catch (error) {
        markDatabaseUnavailable(error);
        return [];
    }
});

export const getPublishedReviews = cache(async () => {
    if (shouldBypassDatabase()) return [];

    try {
        return await prisma.customerReview.findMany({
            where: { isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            select: {
                id: true,
                customerName: true,
                location: true,
                rating: true,
                title: true,
                tripType: true,
                isVerified: true,
            },
        });
    } catch (error) {
        markDatabaseUnavailable(error);
        return [];
    }
});
