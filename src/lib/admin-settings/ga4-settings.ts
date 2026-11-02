import { decryptString, encryptString } from "@/lib/admin-settings/encryption";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type Ga4Settings = {
    provider: "ga4" | "gtm";
    gtmContainerId: string;
    measurementId: string;
    propertyId: string;
    serviceAccountEmail: string;
    serviceAccountPrivateKey: string;
};

type StoredGa4Settings = Partial<Ga4Settings>;

const ADMIN_SETTINGS_KEY = "ga4";

function sanitize(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function normalizePrivateKey(raw: string): string {
    return raw.replace(/\\n/g, "\n").trim();
}

function emptySettings(): Ga4Settings {
    return {
        provider: "ga4",
        gtmContainerId: "",
        measurementId: "",
        propertyId: "",
        serviceAccountEmail: "",
        serviceAccountPrivateKey: "",
    };
}

export async function getStoredGa4Settings(): Promise<Ga4Settings> {
    if (shouldBypassDatabase()) {
        return emptySettings();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: ADMIN_SETTINGS_KEY },
            select: { value: true },
        });

        if (!row) {
            return emptySettings();
        }

        const decrypted = decryptString(row.value);
        const parsed = JSON.parse(decrypted) as StoredGa4Settings;
        const provider = sanitize(parsed.provider).toLowerCase();

        return {
            provider: provider === "gtm" ? "gtm" : "ga4",
            gtmContainerId: sanitize(parsed.gtmContainerId),
            measurementId: sanitize(parsed.measurementId),
            propertyId: sanitize(parsed.propertyId),
            serviceAccountEmail: sanitize(parsed.serviceAccountEmail),
            serviceAccountPrivateKey: normalizePrivateKey(
                sanitize(parsed.serviceAccountPrivateKey),
            ),
        };
    } catch (err) {
        markDatabaseUnavailable(err);
        return emptySettings();
    }
}

export async function saveStoredGa4Settings(input: Ga4Settings): Promise<void> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving admin settings.");
    }

    const payload: Ga4Settings = {
        provider: input.provider === "gtm" ? "gtm" : "ga4",
        gtmContainerId: sanitize(input.gtmContainerId),
        measurementId: sanitize(input.measurementId),
        propertyId: sanitize(input.propertyId),
        serviceAccountEmail: sanitize(input.serviceAccountEmail),
        serviceAccountPrivateKey: normalizePrivateKey(
            sanitize(input.serviceAccountPrivateKey),
        ),
    };

    const encryptedValue = encryptString(JSON.stringify(payload));

    await prisma.adminSetting.upsert({
        where: { key: ADMIN_SETTINGS_KEY },
        update: { value: encryptedValue },
        create: { key: ADMIN_SETTINGS_KEY, value: encryptedValue },
    });
}

export type PublicAnalyticsConfig =
    | { provider: "gtm"; id: string }
    | { provider: "ga4"; id: string }
    | null;

// IDs are interpolated into inline scripts, so only accept the documented formats.
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
const GA4_ID_PATTERN = /^G-[A-Z0-9]+$/;

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

    const stored = await getStoredGa4Settings();
    const gtmId = stored.gtmContainerId.toUpperCase();
    const measurementId = stored.measurementId.toUpperCase();

    if (stored.provider === "gtm") {
        return GTM_ID_PATTERN.test(gtmId) ? { provider: "gtm", id: gtmId } : null;
    }

    return GA4_ID_PATTERN.test(measurementId) ? { provider: "ga4", id: measurementId } : null;
}
