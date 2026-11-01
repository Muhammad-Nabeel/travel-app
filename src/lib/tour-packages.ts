// Client-safe tour package helpers. Database reads live in
// src/lib/tour-package-data.ts so Prisma never reaches the browser bundle.

export type TourPackage = {
    id: string;
    slug: string;
    title: string;
    destination: string;
    tourType: string;
    duration: number;
    description: string;
    highlights: string[];
    imageUrl: string;
    pricePerAdult: number;
    pricePerChild: number;
    currency: string;
    rating: number;
    reviewCount: number;
    sortOrder: number;
    isActive: boolean;
    seoTitle: string;
    seoDescription: string;
    updatedAt: string;
};

export function toTourPackageSlug(title: string) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export function getTourPackagePath(slug: string) {
    return `/tour-packages/${slug}`;
}

/**
 * Gallery photos for a tour page: the card photo first, then any extra
 * IMAGE_ASSETS_BRIEF.md §5.9 photos (tour-<place>-2.jpg …) listed here.
 */
const EXTRA_TOUR_PHOTOS: Record<string, { src: string; alt: string }[]> = {};

export function getTourPackageGallery(pkg: TourPackage) {
    return [
        { src: pkg.imageUrl, alt: pkg.destination },
        ...(EXTRA_TOUR_PHOTOS[pkg.slug] ?? []),
    ];
}
