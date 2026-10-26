import { cache } from "react";
import type { UmrahPackage } from "@prisma/client";

import { DUMMY_PACKAGES, type PackageRow } from "@/app/api/packages/route";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { fitTitle } from "@/lib/seo-copy";

// Server-side reads for public Umrah pages. Pages call these directly rather
// than fetching their own /api/packages over HTTP, and only PUBLISHED
// packages are ever returned.

export type PublicPackages = {
    packages: PackageRow[];
    isDummy: boolean;
};

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
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
    };
}

function publishedDummyPackages(): PublicPackages {
    return {
        packages: DUMMY_PACKAGES.filter((pkg) => pkg.status === "PUBLISHED"),
        isDummy: true,
    };
}

export const getPublishedUmrahPackages = cache(async (): Promise<PublicPackages> => {
    if (shouldBypassDatabase()) {
        return publishedDummyPackages();
    }

    try {
        const rows = await prisma.umrahPackage.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { startDate: "asc" },
        });

        if (rows.length === 0) {
            return publishedDummyPackages();
        }

        return { packages: rows.map(toPackageRow), isDummy: false };
    } catch (err) {
        markDatabaseUnavailable(err);
        return publishedDummyPackages();
    }
});

export const getPublishedUmrahPackageBySlug = cache(
    async (slug: string): Promise<{ pkg: PackageRow; isDummy: boolean } | null> => {
        const findDummy = () => {
            const pkg = DUMMY_PACKAGES.find(
                (item) => item.slug === slug && item.status === "PUBLISHED",
            );
            return pkg ? { pkg, isDummy: true } : null;
        };

        if (shouldBypassDatabase()) {
            return findDummy();
        }

        try {
            const row = await prisma.umrahPackage.findFirst({
                where: { status: "PUBLISHED", OR: [{ slug }, { id: slug }] },
            });

            return row ? { pkg: toPackageRow(row), isDummy: false } : null;
        } catch (err) {
            markDatabaseUnavailable(err);
            return findDummy();
        }
    },
);

export function getUmrahPackagePath(slug: string) {
    return `/umrah-packages/${slug}`;
}

/** SEO title/description from package fields (see SEO_AND_EXECUTION_PLAN.md C.2). */
export function buildUmrahPackageSeo(pkg: PackageRow) {
    const totalNights = pkg.makkahNights + pkg.madinahNights;
    const departs = new Date(pkg.startDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
    const price = `${pkg.currency} ${Math.round(pkg.basePrice).toLocaleString("en-GB")}`;
    const hotel = pkg.hotelSummary ? ` ${pkg.hotelSummary.replace(/\.$/, "")}.` : "";

    return {
        title: fitTitle(
            `${pkg.title} – ${totalNights} Nights from ${pkg.departureCity}`,
            /umrah/i.test(pkg.title)
                ? `${pkg.title} – ${totalNights} Nights`
                : `${pkg.title} – ${totalNights}-Night Umrah`,
            pkg.title,
        ),
        description:
            `${totalNights}-night Umrah from ${pkg.departureCity}: ${pkg.makkahNights} nights Makkah, ` +
            `${pkg.madinahNights} nights Madinah.${hotel} From ${price} per person. Departs ${departs}.`,
    };
}
