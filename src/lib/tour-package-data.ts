import { cache } from "react";
import type { TourPackage as TourPackageRecord } from "@prisma/client";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { toTourPackageSlug, type TourPackage } from "@/lib/tour-packages";

// Server-side reads for public tour pages. Pages call these directly rather
// than fetching /api/tour-packages over HTTP, and only active packages are
// ever returned.

export function toTourPackageRow(pkg: TourPackageRecord): TourPackage {
    return {
        id: pkg.id,
        slug: pkg.slug,
        title: pkg.title,
        destination: pkg.destination,
        tourType: pkg.tourType,
        duration: pkg.duration,
        description: pkg.description,
        highlights: pkg.highlights as string[],
        imageUrl: pkg.imageUrl,
        pricePerAdult: Number(pkg.pricePerAdult),
        pricePerChild: Number(pkg.pricePerChild),
        currency: pkg.currency,
        rating: pkg.rating,
        reviewCount: pkg.reviewCount,
        sortOrder: pkg.sortOrder,
        isActive: pkg.isActive,
        seoTitle: pkg.seoTitle,
        seoDescription: pkg.seoDescription,
        updatedAt: pkg.updatedAt.toISOString(),
    };
}

export const getActiveTourPackages = cache(async (): Promise<TourPackage[]> => {
    if (shouldBypassDatabase()) {
        return [];
    }

    try {
        const rows = await prisma.tourPackage.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });

        return rows.map(toTourPackageRow);
    } catch (err) {
        markDatabaseUnavailable(err);
        return [];
    }
});

// Accepts the slug or, for links shared by id, the id.
export const getActiveTourPackageBySlug = cache(
    async (slug: string): Promise<TourPackage | null> => {
        if (shouldBypassDatabase()) {
            return null;
        }

        try {
            const row = await prisma.tourPackage.findFirst({
                where: { isActive: true, OR: [{ slug }, { id: slug }] },
            });

            return row ? toTourPackageRow(row) : null;
        } catch (err) {
            markDatabaseUnavailable(err);
            return null;
        }
    },
);

/**
 * Builds a unique slug such as "golden-dubai-explorer" from the title.
 * `excludeId` lets a package keep its own slug.
 */
export async function getUniqueTourPackageSlug(title: string, excludeId?: string) {
    const baseSlug =
        toTourPackageSlug(title).replace(/^-|-$/g, "").slice(0, 80) || "tour-package";

    for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
        const existing = await prisma.tourPackage.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existing || existing.id === excludeId) {
            return candidate;
        }
    }

    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
}
