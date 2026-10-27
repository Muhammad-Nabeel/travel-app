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

/**
 * Gallery photos for a tour page: the card photo first, then any extra
 * IMAGE_ASSETS_BRIEF.md §5.9 photos (tour-<place>-2.jpg …) listed here.
 */
const EXTRA_TOUR_PHOTOS: Record<string, { src: string; alt: string }[]> = {};

export function getTourPackageGallery(pkg: TourPackage) {
    return [
        { src: pkg.image, alt: pkg.destination },
        ...(EXTRA_TOUR_PHOTOS[pkg.id] ?? []),
    ];
}
