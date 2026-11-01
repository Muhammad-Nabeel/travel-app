import { cache } from "react";
import type { UmrahPackage } from "@prisma/client";

import type { PackageRow } from "@/app/api/packages/route";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

// Server-side reads for public Umrah pages. Pages call these directly rather
// than fetching their own /api/packages over HTTP, and only PUBLISHED
// packages are ever returned.

export function toPackageRow(pkg: UmrahPackage): PackageRow {
    return {
        id: pkg.id,
        slug: pkg.slug,
        title: pkg.title,
        subtitle: pkg.subtitle,
        description: pkg.description,
        makkahNights: pkg.makkahNights,
        madinahNights: pkg.madinahNights,
        departureCity: pkg.departureCity,
        airlineNotes: pkg.airlineNotes,
        hotelSummary: pkg.hotelSummary,
        inclusions: pkg.inclusions as string[],
        exclusions: pkg.exclusions as string[],
        basePrice: Number(pkg.basePrice),
        currency: pkg.currency,
        seatsAvailable: pkg.seatsAvailable,
        startDate: pkg.startDate.toISOString(),
        endDate: pkg.endDate.toISOString(),
        status: pkg.status as PackageRow["status"],
        seoTitle: pkg.seoTitle,
        seoDescription: pkg.seoDescription,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
    };
}

export const getPublishedUmrahPackages = cache(async (): Promise<PackageRow[]> => {
    if (shouldBypassDatabase()) {
        return [];
    }

    try {
        const rows = await prisma.umrahPackage.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { startDate: "asc" },
        });

        return rows.map(toPackageRow);
    } catch (err) {
        markDatabaseUnavailable(err);
        return [];
    }
});

export const getPublishedUmrahPackageBySlug = cache(
    async (slug: string): Promise<PackageRow | null> => {
        if (shouldBypassDatabase()) {
            return null;
        }

        try {
            const row = await prisma.umrahPackage.findFirst({
                where: { status: "PUBLISHED", OR: [{ slug }, { id: slug }] },
            });

            return row ? toPackageRow(row) : null;
        } catch (err) {
            markDatabaseUnavailable(err);
            return null;
        }
    },
);

export function getUmrahPackagePath(slug: string) {
    return `/umrah-packages/${slug}`;
}

/**
 * Photos for the package page gallery. Add the IMAGE_ASSETS_BRIEF.md §5.8
 * files here (e.g. /images/umrah/umrah-haram-exterior.jpg) once they exist.
 */
export const UMRAH_GALLERY: { src: string; alt: string }[] = [
    { src: "/images/hero-madinah.webp", alt: "Masjid an-Nabawi in Madinah" },
];
