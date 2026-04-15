import { tourPackageResults } from "@/lib/mock-data";

export type TourPackage = (typeof tourPackageResults)[number];

export function toTourPackageSlug(title: string) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export function getTourPackagePath(title: string) {
    return `/tour-packages/${toTourPackageSlug(title)}`;
}

export function findTourPackageBySlug(slug: string) {
    return (
        tourPackageResults.find((pkg) => toTourPackageSlug(pkg.title) === slug) ??
        null
    );
}
