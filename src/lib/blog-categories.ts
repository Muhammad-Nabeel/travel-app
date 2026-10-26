// Blog category hubs (/blog/category/[category]). Each hub needs its own
// title, description and intro text so it can rank as a page in its own
// right instead of being a thin filter of /blog. Keys must match the
// `category` enum in src/lib/validations/blog.ts.

export type BlogCategoryConfig = {
    label: string;
    title: string;
    description: string;
    heading: string;
    intro: string;
};

export const BLOG_CATEGORIES = {
    umrah: {
        label: "Umrah",
        title: "Umrah Guides – Rituals, Duas & Planning Tips",
        description:
            "Practical Umrah guides covering ihram, tawaf, sa'i, duas, best times to travel and costs from Pakistan. Written and reviewed by experienced Umrah advisers.",
        heading: "Umrah Guides",
        intro:
            "Everything you need to prepare for Umrah with confidence: step-by-step rituals, the duas for each stage, what to pack, when to travel and what it costs from Pakistan.",
    },
    flights: {
        label: "Flights",
        title: "Flight Tips – Fares, Baggage & Booking Advice",
        description:
            "When to book, how baggage rules work and how to find cheaper fares from Pakistan. Straightforward flight advice from our ticketing team.",
        heading: "Flight Tips",
        intro:
            "Advice from our ticketing team on finding better fares, understanding baggage and Zamzam allowances, and choosing the right airline and route.",
    },
    destinations: {
        label: "Destinations",
        title: "Destination Guides – Where to Go and When",
        description:
            "In-depth guides to Dubai, Istanbul, Bali, Cairo and more: best time to visit, costs, visas and itineraries for travellers from Pakistan.",
        heading: "Destination Guides",
        intro:
            "Plan your next holiday with practical guides to the places our travellers love most, including when to go, how long to stay and what to budget.",
    },
    hotels: {
        label: "Hotels",
        title: "Hotel Guides – Makkah, Madinah & Beyond",
        description:
            "Where to stay in Makkah, Madinah and popular holiday cities: hotel comparisons by distance, star rating and budget, with booking tips from our team.",
        heading: "Hotel Guides",
        intro:
            "Compare hotels by walking distance to the Haram and Masjid an-Nabawi, star rating and budget, and learn how room sharing affects your package price.",
    },
    tips: {
        label: "Tips",
        title: "Travel Tips – Packing, Visas & Money Advice",
        description:
            "Practical travel advice for travellers from Pakistan: packing lists, visa preparation, travel money, insurance and how to avoid common booking mistakes.",
        heading: "Travel Tips",
        intro:
            "Short, practical advice that saves time and money: what to pack, how to prepare visa documents, and what to check before you pay for any trip.",
    },
    travel: {
        label: "Travel",
        title: "Travel Inspiration – Ideas & Itineraries",
        description:
            "Trip ideas and itineraries for families, couples and groups travelling from Pakistan, from short city breaks to long holidays and faith journeys.",
        heading: "Travel Inspiration",
        intro:
            "Ideas for your next journey, from family-friendly city breaks to longer holidays that combine sightseeing with time for rest and reflection.",
    },
    news: {
        label: "News",
        title: "Travel News – Visa, Airline & Umrah Updates",
        description:
            "The latest Saudi visa rules, airline route changes, Umrah regulations and travel advisories that affect travellers from Pakistan, explained simply.",
        heading: "Travel News",
        intro:
            "Updates that affect your plans: changes to visa rules, airline routes, Umrah regulations and travel advisories, explained in plain language.",
    },
} satisfies Record<string, BlogCategoryConfig>;

export type BlogCategoryKey = keyof typeof BLOG_CATEGORIES;

export function isBlogCategory(value: string): value is BlogCategoryKey {
    return Object.prototype.hasOwnProperty.call(BLOG_CATEGORIES, value);
}

export function getBlogCategoryLabel(value: string) {
    return isBlogCategory(value) ? BLOG_CATEGORIES[value].label : value;
}

export function getBlogCategoryPath(category: string) {
    return `/blog/category/${encodeURIComponent(category)}`;
}
