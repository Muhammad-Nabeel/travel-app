"use client";

import { createContext, useContext } from "react";

import type { PublicBrand } from "@/lib/admin-settings/brand-settings";
import type { BrandAssetSlot } from "@/lib/brand-assets";
import { SITE_NAME } from "@/lib/seo";

const BrandContext = createContext<PublicBrand>({ name: SITE_NAME, logoUrl: null, assets: {} });

/** Gives client components the brand name and logo set in Admin → Settings → Brand. */
export function BrandProvider({
    brand,
    children,
}: {
    brand: PublicBrand;
    children: React.ReactNode;
}) {
    return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): PublicBrand {
    return useContext(BrandContext);
}

/** URL of an uploaded brand image, or undefined to use the built-in icon. */
export function useBrandAsset(slot: BrandAssetSlot): string | undefined {
    return useContext(BrandContext).assets[slot];
}
