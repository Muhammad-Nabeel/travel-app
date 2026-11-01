// Hero banners an admin can upload in Admin → Media → Page Banners. Safe to
// import from client components: it has no server dependencies.

export const PAGE_BANNER_SLOTS = [
    "home",
    "flights",
    "umrah",
    "tours",
    "hotels",
    "visa",
    "activities",
] as const;

export type PageBannerSlot = (typeof PAGE_BANNER_SLOTS)[number];

/** Every page always has a banner; there is no empty state. */
export type PageBanners = Record<PageBannerSlot, string>;

export const PAGE_BANNER_INFO: Record<PageBannerSlot, { label: string; path: string }> = {
    home: { label: "Home page", path: "/" },
    flights: { label: "Flights", path: "/flights" },
    umrah: { label: "Umrah packages", path: "/umrah-packages" },
    tours: { label: "Tour packages", path: "/tour-packages" },
    hotels: { label: "Hotels", path: "/hotels" },
    visa: { label: "Visa", path: "/visa" },
    activities: { label: "Things to do", path: "/activities" },
};

/** The photos each page shipped with; stored as the initial banner and used by "Reset". */
export const BUILT_IN_PAGE_BANNERS: PageBanners = {
    home: "/images/hero-madinah.webp",
    flights: "/images/hero-madinah.webp",
    umrah: "/images/hero-madinah.webp",
    tours: "/images/hero-flight.webp",
    hotels: "/images/hero-madinah.webp",
    visa: "/images/hero-flight.webp",
    activities: "/images/hero-flight.webp",
};

export function isPageBannerSlot(value: unknown): value is PageBannerSlot {
    return typeof value === "string" && (PAGE_BANNER_SLOTS as readonly string[]).includes(value);
}

/**
 * Reads the stored banner map. Slots missing from a row saved before that slot
 * existed are backfilled with the built-in photo, so every slot has a value.
 */
export function sanitizePageBanners(value: unknown): PageBanners {
    const stored = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const banners = { ...BUILT_IN_PAGE_BANNERS };
    for (const slot of PAGE_BANNER_SLOTS) {
        const url = stored[slot];
        if (typeof url === "string" && url.trim()) banners[slot] = url.trim();
    }
    return banners;
}
