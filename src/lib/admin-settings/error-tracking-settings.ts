import { cache } from "react";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

/**
 * Sentry error tracking, managed in Admin → Settings → Error Tracking. The
 * DSN is stored in the database (it is a public identifier by design: the
 * browser needs it to send errors), so it can be changed without a redeploy.
 */
export type ErrorTrackingSettings = {
    enabled: boolean;
    dsn: string;
    /** Shown in Sentry to tell live errors from staging/dev ones. */
    environment: string;
    /** Share of requests sent as performance traces (0 = errors only). */
    tracesSampleRate: number;
};

/** What the browser needs; null when tracking is off. */
export type PublicErrorTrackingConfig = Pick<
    ErrorTrackingSettings,
    "dsn" | "environment" | "tracesSampleRate"
>;

const ADMIN_SETTINGS_KEY = "error_tracking";

const DISABLED: ErrorTrackingSettings = {
    enabled: false,
    dsn: "",
    environment: "production",
    tracesSampleRate: 0,
};

// https://<public key>@<host>/<project id>
const DSN_PATTERN = /^https:\/\/[0-9a-f]+@[a-z0-9.-]+(:\d+)?\/\d+$/i;

export function normalizeErrorTrackingSettings(
    input: Partial<Record<keyof ErrorTrackingSettings, unknown>>,
): ErrorTrackingSettings {
    const rate = Number(input.tracesSampleRate);
    const environment =
        typeof input.environment === "string" ? input.environment.trim().slice(0, 64) : "";
    return {
        enabled: input.enabled === true,
        dsn: typeof input.dsn === "string" ? input.dsn.trim() : "",
        environment: environment || DISABLED.environment,
        tracesSampleRate: Number.isFinite(rate) ? Math.min(1, Math.max(0, Number(rate.toFixed(2)))) : 0,
    };
}

/** Error message when the settings cannot be saved, or null. */
export function validateErrorTrackingSettings(settings: ErrorTrackingSettings): string | null {
    if (!settings.enabled) return null;
    if (!settings.dsn) return "Enter the Sentry DSN before enabling error tracking.";
    if (!DSN_PATTERN.test(settings.dsn)) {
        return "The DSN should look like https://abc123@o123.ingest.sentry.io/456 (Sentry → Project Settings → Client Keys).";
    }
    if (!/^[A-Za-z0-9_.-]+$/.test(settings.environment)) {
        return "Environment may only contain letters, numbers, dots, dashes and underscores.";
    }
    return null;
}

// Memoized per request: the layout and the page both read it during one render.
export const getStoredErrorTrackingSettings = cache(async (): Promise<ErrorTrackingSettings> => {
    if (shouldBypassDatabase()) return DISABLED;

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: ADMIN_SETTINGS_KEY },
            select: { value: true },
        });
        if (!row) return DISABLED;
        return normalizeErrorTrackingSettings(JSON.parse(row.value) as Record<string, unknown>);
    } catch (err) {
        markDatabaseUnavailable(err);
        return DISABLED;
    }
});

/** Settings to report with, or null when tracking is off or incomplete. */
export async function getActiveErrorTrackingSettings(): Promise<ErrorTrackingSettings | null> {
    const settings = await getStoredErrorTrackingSettings();
    if (!settings.enabled || validateErrorTrackingSettings(settings) !== null) return null;
    return settings;
}

export async function getPublicErrorTrackingConfig(): Promise<PublicErrorTrackingConfig | null> {
    const active = await getActiveErrorTrackingSettings();
    return active
        ? { dsn: active.dsn, environment: active.environment, tracesSampleRate: active.tracesSampleRate }
        : null;
}

export async function saveStoredErrorTrackingSettings(input: ErrorTrackingSettings): Promise<void> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving admin settings.");
    }

    const payload = normalizeErrorTrackingSettings(input);
    const invalid = validateErrorTrackingSettings(payload);
    if (invalid) throw new Error(invalid);

    const value = JSON.stringify(payload);
    await prisma.adminSetting.upsert({
        where: { key: ADMIN_SETTINGS_KEY },
        update: { value },
        create: { key: ADMIN_SETTINGS_KEY, value },
    });
}
