import { revalidatePath } from "next/cache";

/**
 * Admin saves mark only the cached pages that show the changed data as stale;
 * those pages are rebuilt once, on their next visit. Every other page keeps
 * its cached copy (pages re-render daily anyway as a safety net).
 *
 * When a page starts reading one of these content types, add it here, or it
 * will show the old data for up to a day after an admin save.
 */
const CONTENT_PAGES = {
    // Homepage, /flights and /hotels carousels, activity pages (destination
    // name and link), destination pages.
    destinations: [
        "/",
        "/flights",
        "/hotels",
        "/activities",
        "/activities/[slug]",
        "/destinations/[slug]",
        "/sitemap.xml",
    ],
    activities: [
        "/",
        "/flights",
        "/hotels",
        "/activities",
        "/activities/[slug]",
        "/destinations/[slug]",
        "/sitemap.xml",
    ],
    reviews: ["/"],
    // Latest posts also appear on the homepage, /flights and /hotels.
    blog: ["/", "/flights", "/hotels", "/blog", "/blog/[slug]", "/blog/category/[category]", "/sitemap.xml"],
    umrahPackages: ["/umrah-packages", "/umrah-packages/[slug]", "/sitemap.xml"],
    tourPackages: ["/tour-packages", "/tour-packages/[id]", "/sitemap.xml"],
    flightRoutes: ["/flights", "/flights/[route]", "/sitemap.xml"],
    // Route pages link to the matching visa page.
    visaCountries: ["/visa", "/visa/[slug]", "/flights/[route]", "/sitemap.xml"],
    airlinePartners: ["/"],
    jobOpenings: ["/careers"],
    // Organization structured data.
    branches: ["/", "/contact-us"],
    pageBanners: ["/", "/activities", "/flights", "/hotels", "/tour-packages", "/umrah-packages", "/visa"],
    contentPages: [
        "/about-us",
        "/arrange-a-call",
        "/careers",
        "/contact-us",
        "/cookie-policy",
        "/faq",
        "/privacy-policy",
        "/refund-policy",
        "/terms-conditions",
    ],
} as const satisfies Record<string, readonly string[]>;

export type PublicContent = keyof typeof CONTENT_PAGES;

/** Pages that show the given content (see CONTENT_PAGES). */
export function revalidateContent(content: PublicContent) {
    for (const path of CONTENT_PAGES[content]) {
        // A path with a [segment] is a route pattern and needs the "page" type.
        if (path.includes("[")) revalidatePath(path, "page");
        else revalidatePath(path);
    }
}

/**
 * For settings rendered in the root layout (brand, logo, SEO, analytics,
 * footer contact details, CAPTCHA, error tracking), which every page shows.
 */
export function revalidatePublicSite() {
    revalidatePath("/", "layout");
    // Not under the root layout, but they show the brand name.
    revalidatePath("/opengraph-image");
    revalidatePath("/twitter-image");
}
