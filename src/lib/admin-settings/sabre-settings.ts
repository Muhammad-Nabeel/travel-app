import { decryptString, encryptString } from "@/lib/admin-settings/encryption";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type SabreSettings = {
    enabled: boolean;
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    pseudoCityCode: string;
    cpaId: string;
    requestorCompanyCode: string;
    isoCountry: string;
    isoCurrency: string;
    ndcEnabled: boolean;
    /** Airlines requested in flight search (IATA codes). */
    includeVendorCodes: string[];
    flightSearchPath: string;
    fareCalendarPath: string;
};

/** Raw input from the admin form; airline codes may arrive as comma-separated text. */
export type SabreSettingsInput = Partial<Omit<SabreSettings, "includeVendorCodes">> & {
    includeVendorCodes?: string | string[];
};

/** Settings with Sabre switched on and every credential present. */
export type ActiveSabreSettings = SabreSettings & { enabled: true };

const ADMIN_SETTINGS_KEY = "sabre";

export const SABRE_REQUIRED_FIELDS = [
    "baseUrl",
    "clientId",
    "clientSecret",
    "pseudoCityCode",
    "cpaId",
    "requestorCompanyCode",
    "isoCountry",
    "isoCurrency",
    "includeVendorCodes",
    "flightSearchPath",
    "fareCalendarPath",
] as const satisfies readonly (keyof SabreSettings)[];

function sanitize(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function emptySettings(): SabreSettings {
    return {
        enabled: false,
        baseUrl: "",
        clientId: "",
        clientSecret: "",
        pseudoCityCode: "",
        cpaId: "",
        requestorCompanyCode: "",
        isoCountry: "",
        isoCurrency: "",
        ndcEnabled: false,
        includeVendorCodes: [],
        flightSearchPath: "",
        fareCalendarPath: "",
    };
}

function sanitizeVendorCodes(value: unknown): string[] {
    const codes = Array.isArray(value)
        ? value
        : typeof value === "string"
            ? value.split(/[\s,]+/)
            : [];

    return Array.from(
        new Set(codes.map((code) => sanitize(code).toUpperCase()).filter(Boolean)),
    );
}

function sanitizePath(value: unknown): string {
    const path = sanitize(value);
    return path && !path.startsWith("/") ? `/${path}` : path;
}

export function normalizeSabreSettings(input: SabreSettingsInput): SabreSettings {
    return {
        enabled: input.enabled === true,
        baseUrl: sanitize(input.baseUrl).replace(/\/+$/, ""),
        clientId: sanitize(input.clientId),
        clientSecret: sanitize(input.clientSecret),
        pseudoCityCode: sanitize(input.pseudoCityCode).toUpperCase(),
        cpaId: sanitize(input.cpaId),
        requestorCompanyCode: sanitize(input.requestorCompanyCode).toUpperCase(),
        isoCountry: sanitize(input.isoCountry).toUpperCase(),
        isoCurrency: sanitize(input.isoCurrency).toUpperCase(),
        ndcEnabled: input.ndcEnabled === true,
        includeVendorCodes: sanitizeVendorCodes(input.includeVendorCodes),
        flightSearchPath: sanitizePath(input.flightSearchPath),
        fareCalendarPath: sanitizePath(input.fareCalendarPath),
    };
}

/** Names of required credential fields that are still blank. */
export function missingSabreFields(settings: SabreSettings): string[] {
    return SABRE_REQUIRED_FIELDS.filter((field) => settings[field].length === 0);
}

export async function getStoredSabreSettings(): Promise<SabreSettings> {
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

        return normalizeSabreSettings(
            JSON.parse(decryptString(row.value)) as Partial<SabreSettings>,
        );
    } catch (err) {
        markDatabaseUnavailable(err);
        return emptySettings();
    }
}

/** Returns the Sabre settings only when the integration is switched on and complete. */
export async function getActiveSabreSettings(): Promise<ActiveSabreSettings | null> {
    const settings = await getStoredSabreSettings();
    if (!settings.enabled || missingSabreFields(settings).length > 0) {
        return null;
    }

    return settings as ActiveSabreSettings;
}

export async function saveStoredSabreSettings(input: SabreSettings): Promise<void> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving admin settings.");
    }

    const payload = normalizeSabreSettings(input);

    if (payload.enabled) {
        const missing = missingSabreFields(payload);
        if (missing.length > 0) {
            throw new Error(
                `Fill in all Sabre credentials before enabling it. Missing: ${missing.join(", ")}.`,
            );
        }
    }

    const encryptedValue = encryptString(JSON.stringify(payload));

    await prisma.adminSetting.upsert({
        where: { key: ADMIN_SETTINGS_KEY },
        update: { value: encryptedValue },
        create: { key: ADMIN_SETTINGS_KEY, value: encryptedValue },
    });
}
