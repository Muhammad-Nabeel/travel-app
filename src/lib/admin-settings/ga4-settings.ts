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
