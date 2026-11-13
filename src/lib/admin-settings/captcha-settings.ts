import { cache } from "react";

import { decryptString, encryptString } from "@/lib/admin-settings/encryption";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

/**
 * Cloudflare Turnstile on public forms (sign-up, contact, enquiries, booking,
 * reviews, chatbot). Admin → Settings → Form Protection is the only way to
 * turn it on: the keys live in the database (encrypted with
 * ADMIN_SETTINGS_ENCRYPTION_KEY), never in env vars or code.
 */
export type CaptchaSettings = {
    enabled: boolean;
    siteKey: string;
    secretKey: string;
};

const ADMIN_SETTINGS_KEY = "captcha_turnstile";

const DISABLED: CaptchaSettings = { enabled: false, siteKey: "", secretKey: "" };

function sanitize(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export function normalizeCaptchaSettings(
    input: Partial<Record<keyof CaptchaSettings, unknown>>,
): CaptchaSettings {
    return {
        enabled: input.enabled === true,
        siteKey: sanitize(input.siteKey),
        secretKey: sanitize(input.secretKey),
    };
}

/** Error message when the settings cannot be saved, or null. */
export function validateCaptchaSettings(settings: CaptchaSettings): string | null {
    if (!settings.enabled) return null;
    if (!settings.siteKey || !settings.secretKey) {
        return "Enter the Turnstile site key and secret key before enabling form protection.";
    }
    // Live keys start with 0x; Cloudflare's test keys (for localhost) with 1x–3x.
    if (!/^[0-3]x[0-9A-Za-z_-]{10,}$/.test(settings.siteKey)) {
        return "Turnstile site key must start with 0x (copy it from Cloudflare → Turnstile).";
    }
    return null;
}

// Memoized per request: the layout and the page both read it during one render.
export const getStoredCaptchaSettings = cache(async (): Promise<CaptchaSettings> => {
    if (shouldBypassDatabase()) return DISABLED;

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: ADMIN_SETTINGS_KEY },
            select: { value: true },
        });
        // Not configured in admin yet: forms run without the check.
        if (!row) return DISABLED;

        return normalizeCaptchaSettings(
            JSON.parse(decryptString(row.value)) as Record<string, unknown>,
        );
    } catch (err) {
        markDatabaseUnavailable(err);
        return DISABLED;
    }
});

/** Settings forms should enforce, or null when protection is off or incomplete. */
export async function getActiveCaptchaSettings(): Promise<CaptchaSettings | null> {
    const settings = await getStoredCaptchaSettings();
    if (!settings.enabled || validateCaptchaSettings(settings) !== null) return null;
    return settings;
}

/** The public site key for the browser widget, or null when protection is off. */
export async function getPublicCaptchaSiteKey(): Promise<string | null> {
    return (await getActiveCaptchaSettings())?.siteKey ?? null;
}

export async function saveStoredCaptchaSettings(input: CaptchaSettings): Promise<void> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving admin settings.");
    }

    const payload = normalizeCaptchaSettings(input);
    const invalid = validateCaptchaSettings(payload);
    if (invalid) throw new Error(invalid);

    const value = encryptString(JSON.stringify(payload));
    await prisma.adminSetting.upsert({
        where: { key: ADMIN_SETTINGS_KEY },
        update: { value },
        create: { key: ADMIN_SETTINGS_KEY, value },
    });
}
