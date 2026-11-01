// Brand images an admin can upload in Admin → Media → Brand & Icons. Safe to
// import from client components: it has no server dependencies.

export const BRAND_ASSET_SLOTS = [
    "icon",
    "flights",
    "umrah",
    "tours",
    "hotels",
    "visa",
    "activities",
    "emptyFlights",
    "emptyPackages",
    "support",
    "account",
    "whyPrices",
    "whySupport",
    "whySecure",
    "whyUmrah",
    "hotline",
    "footerEmail",
    "footerPhone",
    "footerWhatsapp",
    "footerAddress",
    "footerContactUs",
    "footerArrangeCall",
    "footerFaq",
] as const;

export type BrandAssetSlot = (typeof BRAND_ASSET_SLOTS)[number];

/**
 * Uploaded image URL per slot. A missing slot from BUILT_IN_ICON_SLOTS falls
 * back to the built-in icon; any other missing slot shows no icon.
 */
export type BrandAssets = Partial<Record<BrandAssetSlot, string>>;

export const BRAND_ASSET_INFO: Record<BrandAssetSlot, { label: string; hint: string }> = {
    icon: { label: "App icon", hint: "Browser tab favicon and the sign-in mark. Square PNG, 512×512." },
    flights: { label: "Flights icon", hint: "Home search tabs and site menu." },
    umrah: { label: "Umrah icon", hint: "Home search tabs and site menu." },
    tours: { label: "Tours icon", hint: "Home search tabs and site menu." },
    hotels: { label: "Hotels icon", hint: "Home search tabs and site menu." },
    visa: { label: "Visa icon", hint: "Home search tabs and site menu." },
    activities: { label: "Things to do icon", hint: "Home search tabs and site menu." },
    emptyFlights: { label: "No flights found", hint: "Shown when no fares match the filters." },
    emptyPackages: { label: "No packages found", hint: "Shown when no tour or Umrah package matches." },
    support: { label: "Support", hint: "Header and mobile menu, next to the Support link." },
    account: { label: "Account", hint: "Header avatar for signed-in users. Square image." },
    whyPrices: { label: "Transparent prices", hint: "Home page, Why book with us section." },
    whySupport: { label: "24/7 live support", hint: "Home page, Why book with us section." },
    whySecure: { label: "Secure booking", hint: "Home page, Why book with us section." },
    whyUmrah: { label: "Umrah specialists", hint: "Home page, Why book with us section." },
    hotline: { label: "Hotline", hint: "Home page hotline button, next to the phone number." },
    footerEmail: { label: "Email", hint: "Footer contact list, next to the support email." },
    footerPhone: { label: "Phone", hint: "Footer contact list, next to the phone number." },
    footerWhatsapp: { label: "WhatsApp", hint: "Footer contact list, next to the WhatsApp number." },
    footerAddress: { label: "Address", hint: "Footer contact list, next to the office address." },
    footerContactUs: { label: "Contact us", hint: "Footer Help column, Contact us link." },
    footerArrangeCall: { label: "Arrange a call", hint: "Footer Help column, Arrange a call link." },
    footerFaq: { label: "FAQ", hint: "Footer Help column, FAQ link." },
};

export function isFooterAssetSlot(slot: BrandAssetSlot) {
    return slot.startsWith("footer");
}

const BUILT_IN_ICON_SLOTS: readonly BrandAssetSlot[] = [
    "icon",
    "flights",
    "umrah",
    "tours",
    "hotels",
    "visa",
    "activities",
    "emptyFlights",
    "emptyPackages",
    "account",
];

/** Whether an empty slot falls back to a built-in icon instead of showing none. */
export function hasBuiltInIcon(slot: BrandAssetSlot) {
    return BUILT_IN_ICON_SLOTS.includes(slot);
}

export function isBrandAssetSlot(value: unknown): value is BrandAssetSlot {
    return typeof value === "string" && (BRAND_ASSET_SLOTS as readonly string[]).includes(value);
}

export function sanitizeBrandAssets(value: unknown): BrandAssets {
    if (!value || typeof value !== "object") return {};
    const assets: BrandAssets = {};
    for (const [slot, url] of Object.entries(value)) {
        if (isBrandAssetSlot(slot) && typeof url === "string" && url.trim()) {
            assets[slot] = url.trim();
        }
    }
    return assets;
}

/** Payment and accreditation badge shown in the footer badge row. */
export type FooterBadge = {
    url: string;
    /** Alt text, e.g. "Visa" or "IATA accredited". */
    label: string;
};

export function sanitizeFooterBadges(value: unknown): FooterBadge[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const { url, label } = item as Record<string, unknown>;
        if (typeof url !== "string" || !url.trim()) return [];
        if (typeof label !== "string" || !label.trim()) return [];
        return [{ url: url.trim(), label: label.trim().slice(0, 80) }];
    });
}
