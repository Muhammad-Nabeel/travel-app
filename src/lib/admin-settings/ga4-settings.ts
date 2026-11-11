import { decryptString, encryptString } from "@/lib/admin-settings/encryption";
import { ADS_CONVERSION_KEYS, type AdsConversionKey } from "@/lib/analytics/gtm-plan";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

/**
 * Tag loaded on every public page, stored as plain JSON (IDs only, no secrets).
 * With GTM, `measurementId` and the Google Ads fields are not loaded by the
 * site; they are filled into the GTM container download.
 */
export type SiteAnalyticsSettings = {
    provider: "ga4" | "gtm";
    gtmContainerId: string;
    measurementId: string;
    /** Google Ads conversion ID, e.g. AW-123456789. Blank = no Ads tags in the container. */
    adsConversionId: string;
    /** Conversion label per service outcome; blank labels are left out of the container. */
    adsConversionLabels: Record<AdsConversionKey, string>;
};

/** GA4 Data API credentials the admin dashboard reads reports with. Stored encrypted. */
export type DashboardAnalyticsSettings = {
    propertyId: string;
    serviceAccountEmail: string;
    serviceAccountPrivateKey: string;
};

const SITE_ANALYTICS_KEY = "site_analytics";
const DASHBOARD_ANALYTICS_KEY = "dashboard_analytics";
/** Combined row used before site and dashboard analytics were split. */
const LEGACY_GA4_KEY = "ga4";

function sanitize(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function normalizePrivateKey(raw: string): string {
    return raw.replace(/\\n/g, "\n").trim();
}

function normalizeAdsLabels(value: unknown): Record<AdsConversionKey, string> {
    const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    return Object.fromEntries(
        ADS_CONVERSION_KEYS.map((key) => [key, sanitize(source[key])]),
    ) as Record<AdsConversionKey, string>;
}

export function normalizeSiteAnalyticsSettings(
    input: Partial<Record<keyof SiteAnalyticsSettings, unknown>>,
): SiteAnalyticsSettings {
    return {
        provider: sanitize(input.provider).toLowerCase() === "gtm" ? "gtm" : "ga4",
        gtmContainerId: sanitize(input.gtmContainerId).toUpperCase(),
        measurementId: sanitize(input.measurementId).toUpperCase(),
        adsConversionId: sanitize(input.adsConversionId).toUpperCase(),
        adsConversionLabels: normalizeAdsLabels(input.adsConversionLabels),
    };
}

export function normalizeDashboardAnalyticsSettings(
    input: Partial<Record<keyof DashboardAnalyticsSettings, unknown>>,
): DashboardAnalyticsSettings {
    return {
        propertyId: sanitize(input.propertyId),
        serviceAccountEmail: sanitize(input.serviceAccountEmail),
        serviceAccountPrivateKey: normalizePrivateKey(sanitize(input.serviceAccountPrivateKey)),
    };
}

const EMPTY_SITE: SiteAnalyticsSettings = normalizeSiteAnalyticsSettings({});
const EMPTY_DASHBOARD: DashboardAnalyticsSettings = {
    propertyId: "",
    serviceAccountEmail: "",
    serviceAccountPrivateKey: "",
};

/**
 * Splits the legacy combined `ga4` row into the two new rows, once. Existing
 * new rows are never overwritten. Returns what was written (or found).
 */
async function backfillFromLegacy(): Promise<{
    site: SiteAnalyticsSettings;
    dashboard: DashboardAnalyticsSettings;
} | null> {
    const legacy = await prisma.adminSetting.findUnique({
        where: { key: LEGACY_GA4_KEY },
        select: { value: true },
    });
    if (!legacy) return null;

    const parsed = JSON.parse(decryptString(legacy.value)) as Record<string, unknown>;
    const site = normalizeSiteAnalyticsSettings(parsed);
    const dashboard = normalizeDashboardAnalyticsSettings(parsed);

    await prisma.adminSetting.createMany({
        data: [
            { key: SITE_ANALYTICS_KEY, value: JSON.stringify(site) },
            { key: DASHBOARD_ANALYTICS_KEY, value: encryptString(JSON.stringify(dashboard)) },
        ],
        skipDuplicates: true,
    });

    return { site, dashboard };
}

export async function getStoredSiteAnalyticsSettings(): Promise<SiteAnalyticsSettings> {
    if (shouldBypassDatabase()) return EMPTY_SITE;

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: SITE_ANALYTICS_KEY },
            select: { value: true },
        });
        if (row) {
            return normalizeSiteAnalyticsSettings(JSON.parse(row.value) as Record<string, unknown>);
        }
        return (await backfillFromLegacy())?.site ?? EMPTY_SITE;
    } catch (err) {
        markDatabaseUnavailable(err);
        return EMPTY_SITE;
    }
}

export async function getStoredDashboardAnalyticsSettings(): Promise<DashboardAnalyticsSettings> {
    if (shouldBypassDatabase()) return EMPTY_DASHBOARD;

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: DASHBOARD_ANALYTICS_KEY },
            select: { value: true },
        });
        if (row) {
            return normalizeDashboardAnalyticsSettings(
                JSON.parse(decryptString(row.value)) as Record<string, unknown>,
            );
        }
        return (await backfillFromLegacy())?.dashboard ?? EMPTY_DASHBOARD;
    } catch (err) {
        markDatabaseUnavailable(err);
        return EMPTY_DASHBOARD;
    }
}

// IDs are interpolated into inline scripts, so only accept the documented formats.
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
const GA4_ID_PATTERN = /^G-[A-Z0-9]+$/;
const ADS_ID_PATTERN = /^AW-\d+$/;
const ADS_LABEL_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Error message for an invalid site tag, or null when it can be saved. */
export function validateSiteAnalyticsSettings(settings: SiteAnalyticsSettings): string | null {
    if (settings.gtmContainerId && !GTM_ID_PATTERN.test(settings.gtmContainerId)) {
        return "GTM Container ID must look like GTM-XXXXXXX.";
    }
    if (settings.measurementId && !GA4_ID_PATTERN.test(settings.measurementId)) {
        return "Measurement ID must look like G-XXXXXXXXXX.";
    }
    if (settings.adsConversionId && !ADS_ID_PATTERN.test(settings.adsConversionId)) {
        return "Google Ads Conversion ID must look like AW-123456789.";
    }
    const badLabel = Object.values(settings.adsConversionLabels).find(
        (label) => label && !ADS_LABEL_PATTERN.test(label),
    );
    if (badLabel) {
        return `Google Ads conversion label "${badLabel}" may only contain letters, numbers, - and _.`;
    }
    return null;
}

export async function saveStoredSiteAnalyticsSettings(input: SiteAnalyticsSettings): Promise<void> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving admin settings.");
    }

    const payload = normalizeSiteAnalyticsSettings(input);
    const invalid = validateSiteAnalyticsSettings(payload);
    if (invalid) throw new Error(invalid);

    const value = JSON.stringify(payload);
    await prisma.adminSetting.upsert({
        where: { key: SITE_ANALYTICS_KEY },
        update: { value },
        create: { key: SITE_ANALYTICS_KEY, value },
    });
}

export async function saveStoredDashboardAnalyticsSettings(
    input: DashboardAnalyticsSettings,
): Promise<void> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving admin settings.");
    }

    const value = encryptString(JSON.stringify(normalizeDashboardAnalyticsSettings(input)));
    await prisma.adminSetting.upsert({
        where: { key: DASHBOARD_ANALYTICS_KEY },
        update: { value },
        create: { key: DASHBOARD_ANALYTICS_KEY, value },
    });
}

export type PublicAnalyticsConfig =
    | { provider: "gtm"; id: string }
    | { provider: "ga4"; id: string }
    | null;

/** Only the tag IDs the browser needs; never exposes reporting credentials. */
export async function getPublicAnalyticsConfig(): Promise<PublicAnalyticsConfig> {
    const envProvider = sanitize(process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER).toLowerCase();
    const envGtmId = sanitize(process.env.NEXT_PUBLIC_GTM_CONTAINER_ID).toUpperCase();
    const envMeasurementId = sanitize(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID).toUpperCase();

    if (envProvider === "gtm" && GTM_ID_PATTERN.test(envGtmId)) {
        return { provider: "gtm", id: envGtmId };
    }

    if (GA4_ID_PATTERN.test(envMeasurementId)) {
        return { provider: "ga4", id: envMeasurementId };
    }

    const stored = await getStoredSiteAnalyticsSettings();

    if (stored.provider === "gtm") {
        return GTM_ID_PATTERN.test(stored.gtmContainerId)
            ? { provider: "gtm", id: stored.gtmContainerId }
            : null;
    }

    return GA4_ID_PATTERN.test(stored.measurementId)
        ? { provider: "ga4", id: stored.measurementId }
        : null;
}
