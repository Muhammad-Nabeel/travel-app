// Default search titles and descriptions for every static route.
// Titles are the page part only; the root layout appends " | Safar Umrah"
// unless `absolute` is set. Keep titles <= 60 characters including that
// suffix and descriptions between 120 and 160 characters (enforced by
// src/lib/__tests__/seo-copy.test.ts). Admins can override any entry from
// /admin/seo without a deploy.

export const STATIC_PAGE_KEYS = [
    "home",
    "umrahPackages",
    "flights",
    "hotels",
    "visa",
    "tourPackages",
    "activities",
    "blog",
    "aboutUs",
    "contactUs",
    "arrangeCall",
    "faq",
    "careers",
    "termsConditions",
    "privacyPolicy",
    "refundPolicy",
    "cookiePolicy",
] as const;

export type StaticPageKey = (typeof STATIC_PAGE_KEYS)[number];

export type StaticPageSeo = {
    label: string;
    path: string;
    title: string;
    description: string;
    absolute?: boolean;
};

// `{year}` is replaced with the current booking season year at render time
// so titles never go stale.
export const STATIC_PAGE_SEO: Record<StaticPageKey, StaticPageSeo> = {
    home: {
        label: "Homepage",
        path: "/",
        title: "Safar Umrah | Umrah Packages, Flights & Visas from Pakistan",
        description:
            "Book Umrah packages, cheap flights and visa services from Pakistan. Compare hotels near the Haram, pay in instalments or at a branch, and get expert support.",
        absolute: true,
    },
    umrahPackages: {
        label: "Umrah Packages",
        path: "/umrah-packages",
        title: "Umrah Packages from Pakistan – {year} Prices",
        description:
            "Compare 7 to 28-night Umrah packages from Lahore, Karachi and Islamabad. See hotel distance to the Haram, inclusions and per-person prices. Book online.",
    },
    flights: {
        label: "Flights",
        path: "/flights",
        title: "Cheap Flights from Pakistan – Compare & Book",
        description:
            "Search and compare flights from Lahore, Karachi and Islamabad to Jeddah, Madinah, Dubai, London and beyond. Live fares, flexible payment, no hidden fees.",
    },
    hotels: {
        label: "Hotels",
        path: "/hotels",
        title: "Makkah & Madinah Hotels Near the Haram",
        description:
            "Find Makkah and Madinah hotels by walking distance to the Haram and Masjid an-Nabawi. Compare star ratings and room sharing, then request the best rate.",
    },
    visa: {
        label: "Visa Services",
        path: "/visa",
        title: "Visa Services – UAE, Malaysia, Saudi & More",
        description:
            "Get help with UAE, Malaysia and Saudi visas from Pakistan. Check requirements, documents, processing times and fees, then apply with expert support.",
    },
    tourPackages: {
        label: "Tour Packages",
        path: "/tour-packages",
        title: "Tour Packages – Dubai, Turkey, Bali & More",
        description:
            "Explore all-inclusive holiday packages to Dubai, Istanbul, Bali, the Maldives and Cairo. Flights, hotels and tours in one price. Customise and book today.",
    },
    activities: {
        label: "Activities",
        path: "/activities",
        title: "Things to Do – Tours & Activities",
        description:
            "Discover top-rated tours, attractions and experiences in Dubai, Istanbul, Makkah, Madinah and more. Compare prices and reviews before you travel.",
    },
    blog: {
        label: "Blog",
        path: "/blog",
        title: "Umrah & Travel Blog – Guides, Tips and News",
        description:
            "Step-by-step Umrah guides, visa updates, packing lists and destination tips from our travel experts. Plan your pilgrimage or holiday with confidence.",
    },
    aboutUs: {
        label: "About Us",
        path: "/about-us",
        title: "About Us – Trusted Umrah & Travel Agency",
        description:
            "Meet the team behind Safar Umrah. We help pilgrims, families and holidaymakers plan flights, Umrah packages, visas and tours with clear, honest advice.",
    },
    contactUs: {
        label: "Contact Us",
        path: "/contact-us",
        title: "Contact Us – Call, WhatsApp or Visit a Branch",
        description:
            "Speak to a travel adviser by phone or WhatsApp, email us, or visit a branch. See opening hours and addresses for every Safar Umrah office.",
    },
    arrangeCall: {
        label: "Arrange a Call",
        path: "/arrange-a-call",
        title: "Request a Callback from a Travel Expert",
        description:
            "Leave your number and a Safar Umrah adviser will call you back to plan your Umrah, flights or holiday. Free advice with no obligation to book.",
    },
    faq: {
        label: "FAQ",
        path: "/faq",
        title: "Umrah & Travel FAQs – Visas, Payments, Refunds",
        description:
            "Answers to common questions about Umrah visas, payment options, cancellations, baggage, document requirements and what to expect when you book.",
    },
    careers: {
        label: "Careers",
        path: "/careers",
        title: "Careers – Join Our Travel Team",
        description:
            "Explore open roles at Safar Umrah, from travel consultants to operations. Help pilgrims and travellers plan journeys that matter.",
    },
    termsConditions: {
        label: "Terms & Conditions",
        path: "/terms-conditions",
        title: "Terms & Conditions",
        description:
            "Booking terms for flights, Umrah packages, visas and tours with Safar Umrah, including payments, changes, liability and passenger responsibilities.",
    },
    privacyPolicy: {
        label: "Privacy Policy",
        path: "/privacy-policy",
        title: "Privacy Policy",
        description:
            "How Safar Umrah collects, uses and protects your personal data, including passport details, payment information and marketing preferences.",
    },
    refundPolicy: {
        label: "Refund Policy",
        path: "/refund-policy",
        title: "Refund & Cancellation Policy",
        description:
            "Cancellation charges, refund timelines and airline or hotel rules that apply to Safar Umrah flights, Umrah packages, visas and tours.",
    },
    cookiePolicy: {
        label: "Cookie Policy",
        path: "/cookie-policy",
        title: "Cookie Policy",
        description:
            "Which cookies Safar Umrah uses for analytics, preferences and essential site functions, and how to manage or withdraw your consent.",
    },
};

export const TITLE_SUFFIX_LENGTH = " | Safar Umrah".length;
export const MAX_TITLE_LENGTH = 60;
export const MIN_DESCRIPTION_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 160;

/**
 * The year customers are booking for. From November onwards most searches
 * target the following year's Ramadan and winter season.
 */
export function seasonYear(now = new Date()) {
    const year = now.getUTCFullYear();
    return now.getUTCMonth() >= 10 ? year + 1 : year;
}

export function applySeoTokens(value: string, now = new Date()) {
    return value.replace(/\{year\}/g, String(seasonYear(now)));
}

export function fullTitleLength(title: string, absolute = false) {
    return title.length + (absolute ? 0 : TITLE_SUFFIX_LENGTH);
}

// Catalog sections still rendered from src/lib/mock-data.ts. They stay
// noindex (and out of the sitemap) until real inventory is wired up, so
// Google never indexes demo hotels or tours with made-up prices.
// Flip to true once the section reads from the database.
export const CATALOG_INDEXING = {
    hotels: false,
    tourPackages: false,
} as const;

/** First candidate whose full title (with suffix) fits in 60 characters, else the last one. */
export function fitTitle(...candidates: string[]) {
    return (
        candidates.find((title) => fullTitleLength(title) <= MAX_TITLE_LENGTH) ??
        candidates[candidates.length - 1]
    );
}
