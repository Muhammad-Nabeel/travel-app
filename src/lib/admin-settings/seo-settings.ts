import { cache } from "react";
import type { Metadata } from "next";

import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import {
    getPrimaryPhone,
    getStoredSupportContactSettings,
} from "@/lib/admin-settings/support-contact-settings";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { buildMetadata, createOrganizationSchema } from "@/lib/seo";
import {
    applySeoTokens,
    STATIC_PAGE_KEYS,
    STATIC_PAGE_SEO,
    type StaticPageKey,
} from "@/lib/seo-copy";

export type SeoOverride = {
    title: string;
    description: string;
};

export type OrganizationProfile = {
    legalName: string;
    logoUrl: string;
    telephone: string;
    email: string;
    sameAs: string[];
};

export type SeoSettings = {
    pages: Record<StaticPageKey, SeoOverride>;
    organization: OrganizationProfile;
};

const SEO_SETTINGS_KEY = "seo_settings";

function sanitizeText(value: unknown, maxLength = 300): string {
    return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizeUrl(value: unknown): string {
    const text = sanitizeText(value, 500);
    return /^https:\/\/\S+$/i.test(text) ? text : "";
}

export function defaultSeoSettings(): SeoSettings {
    const pages = Object.fromEntries(
        STATIC_PAGE_KEYS.map((key) => [key, { title: "", description: "" }]),
    ) as Record<StaticPageKey, SeoOverride>;

    return {
        pages,
        organization: {
            legalName: "",
            logoUrl: "",
            telephone: "",
            email: "",
            sameAs: [],
        },
    };
}

function sanitizeSeoSettings(value: unknown): SeoSettings {
    const defaults = defaultSeoSettings();
    const source = value && typeof value === "object" ? (value as Partial<SeoSettings>) : {};
    const sourcePages =
        source.pages && typeof source.pages === "object"
            ? (source.pages as Partial<Record<string, Partial<SeoOverride>>>)
            : {};

    const pages = Object.fromEntries(
        STATIC_PAGE_KEYS.map((key) => [
            key,
            {
                title: sanitizeText(sourcePages[key]?.title, 120),
                description: sanitizeText(sourcePages[key]?.description, 320),
            },
        ]),
    ) as Record<StaticPageKey, SeoOverride>;

    const org = (source.organization ?? {}) as Partial<OrganizationProfile>;
    const sameAs = Array.isArray(org.sameAs)
        ? org.sameAs.map(sanitizeUrl).filter(Boolean).slice(0, 10)
        : [];

    return {
        pages,
        organization: {
            legalName: sanitizeText(org.legalName, 150) || defaults.organization.legalName,
            logoUrl: sanitizeUrl(org.logoUrl),
            telephone: sanitizeText(org.telephone, 40),
            email: sanitizeText(org.email, 150),
            sameAs,
        },
    };
}

export const getStoredSeoSettings = cache(async (): Promise<SeoSettings> => {
    if (shouldBypassDatabase()) {
        return defaultSeoSettings();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: SEO_SETTINGS_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaultSeoSettings();
        }

        return sanitizeSeoSettings(JSON.parse(row.value));
    } catch (err) {
        markDatabaseUnavailable(err);
        return defaultSeoSettings();
    }
});

export async function saveStoredSeoSettings(input: unknown): Promise<SeoSettings> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving SEO settings.");
    }

    const payload = sanitizeSeoSettings(input);

    await prisma.adminSetting.upsert({
        where: { key: SEO_SETTINGS_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: SEO_SETTINGS_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}

/** Resolved title/description for a static page: admin override, else default copy. */
export async function getStaticPageSeo(key: StaticPageKey) {
    const [settings, brand] = await Promise.all([
        getStoredSeoSettings(),
        getStoredBrandSettings(),
    ]);
    const defaults = STATIC_PAGE_SEO[key];
    const override = settings.pages[key];
    const now = new Date();

    return {
        path: defaults.path,
        absolute: Boolean(defaults.absolute),
        title: applySeoTokens(override.title || defaults.title, now, brand.name),
        description: applySeoTokens(
            override.description || defaults.description,
            now,
            brand.name,
        ),
        siteName: brand.name,
    };
}

export async function buildStaticPageMetadata(
    key: StaticPageKey,
    options: { noIndex?: boolean } = {},
): Promise<Metadata> {
    const seo = await getStaticPageSeo(key);

    return buildMetadata({
        title: seo.title,
        absoluteTitle: seo.absolute,
        description: seo.description,
        path: seo.path,
        noIndex: options.noIndex,
        siteName: seo.siteName,
    });
}

const getActiveBranches = cache(async () => {
    if (shouldBypassDatabase()) {
        return [];
    }

    try {
        return await prisma.branch.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: { name: true, city: true, address: true, phone: true },
        });
    } catch (err) {
        markDatabaseUnavailable(err);
        return [];
    }
});

/**
 * Organization JSON-LD built only from admin-confirmed data (SEO profile and
 * active branches). Empty fields are omitted rather than filled with
 * placeholder contact details.
 */
export async function buildOrganizationJsonLd() {
    const [settings, branches, contact, brand] = await Promise.all([
        getStoredSeoSettings(),
        getActiveBranches(),
        getStoredSupportContactSettings(),
        getStoredBrandSettings(),
    ]);
    const org = settings.organization;

    return createOrganizationSchema({
        name: brand.name,
        legalName: org.legalName,
        logoUrl: org.logoUrl || brand.logoUrl || undefined,
        telephone: org.telephone || getPrimaryPhone(contact),
        email: org.email || contact.email,
        sameAs: org.sameAs,
        branches,
    });
}
