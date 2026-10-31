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
] as const;

export type BrandAssetSlot = (typeof BRAND_ASSET_SLOTS)[number];

/** Uploaded image URL per slot; a missing slot falls back to the built-in icon. */
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
};

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
