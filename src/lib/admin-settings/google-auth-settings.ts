import { decryptString, encryptString } from "@/lib/admin-settings/encryption";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

/** "Continue with Google" on sign-in and sign-up, managed in Admin → Settings → Google Sign-In. */
export type GoogleAuthSettings = {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
};

const ADMIN_SETTINGS_KEY = "google_auth";

const DISABLED: GoogleAuthSettings = { enabled: false, clientId: "", clientSecret: "" };

function sanitize(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export function normalizeGoogleAuthSettings(
    input: Partial<Record<keyof GoogleAuthSettings, unknown>>,
): GoogleAuthSettings {
    return {
        enabled: input.enabled === true,
        clientId: sanitize(input.clientId),
        clientSecret: sanitize(input.clientSecret),
    };
}

/** Error message when the settings cannot be saved, or null. */
export function validateGoogleAuthSettings(settings: GoogleAuthSettings): string | null {
    if (!settings.enabled) return null;
    if (!settings.clientId || !settings.clientSecret) {
        return "Enter the Google Client ID and Client Secret before enabling Google sign-in.";
    }
    if (!settings.clientId.endsWith(".apps.googleusercontent.com")) {
        return "Google Client ID must end with .apps.googleusercontent.com.";
    }
    return null;
}

/**
 * First read on an install that configured Google through GOOGLE_CLIENT_ID /
 * GOOGLE_CLIENT_SECRET: copy those into the database once so the admin
 * setting becomes the single source of truth.
 */
async function backfillFromEnv(): Promise<GoogleAuthSettings> {
    const fromEnv = normalizeGoogleAuthSettings({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });
    const settings: GoogleAuthSettings = {
        ...fromEnv,
        enabled: validateGoogleAuthSettings({ ...fromEnv, enabled: true }) === null,
    };

    await prisma.adminSetting.createMany({
        data: [{ key: ADMIN_SETTINGS_KEY, value: encryptString(JSON.stringify(settings)) }],
        skipDuplicates: true,
    });
    return settings;
}

export async function getStoredGoogleAuthSettings(): Promise<GoogleAuthSettings> {
    if (shouldBypassDatabase()) return DISABLED;

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: ADMIN_SETTINGS_KEY },
            select: { value: true },
        });
        if (!row) return await backfillFromEnv();

        return normalizeGoogleAuthSettings(
            JSON.parse(decryptString(row.value)) as Record<string, unknown>,
        );
    } catch (err) {
        markDatabaseUnavailable(err);
        return DISABLED;
    }
}

/** Credentials NextAuth should register, or null when Google sign-in is off or incomplete. */
export async function getActiveGoogleCredentials(): Promise<
    Pick<GoogleAuthSettings, "clientId" | "clientSecret"> | null
> {
    const settings = await getStoredGoogleAuthSettings();
    if (!settings.enabled || validateGoogleAuthSettings(settings) !== null) return null;
    return { clientId: settings.clientId, clientSecret: settings.clientSecret };
}

export async function saveStoredGoogleAuthSettings(input: GoogleAuthSettings): Promise<void> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving admin settings.");
    }

    const payload = normalizeGoogleAuthSettings(input);
    const invalid = validateGoogleAuthSettings(payload);
    if (invalid) throw new Error(invalid);

    const value = encryptString(JSON.stringify(payload));
    await prisma.adminSetting.upsert({
        where: { key: ADMIN_SETTINGS_KEY },
        update: { value },
        create: { key: ADMIN_SETTINGS_KEY, value },
    });
}
