import * as Sentry from "@sentry/nextjs";

import {
    getActiveErrorTrackingSettings,
    type ErrorTrackingSettings,
} from "@/lib/admin-settings/error-tracking-settings";
import { privacySafeDataCollection } from "@/lib/error-tracking/data-collection";

/**
 * Server-side Sentry, configured from Admin → Settings → Error Tracking.
 * Settings are re-read every few minutes so turning tracking on or off, or
 * changing the DSN, takes effect without a redeploy or restart.
 */

const REFRESH_MS = 5 * 60 * 1000;

let appliedKey: string | null = null;
let lastCheckedAt = 0;
let refreshing: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function keyOf(settings: ErrorTrackingSettings | null) {
    return settings ? `${settings.dsn}|${settings.environment}|${settings.tracesSampleRate}` : "off";
}

async function apply(settings: ErrorTrackingSettings | null) {
    const key = keyOf(settings);
    if (key === appliedKey) return;

    if (!settings) {
        if (appliedKey && appliedKey !== "off") await Sentry.close(2000);
        appliedKey = "off";
        return;
    }

    Sentry.init({
        dsn: settings.dsn,
        environment: settings.environment,
        tracesSampleRate: settings.tracesSampleRate,
        // Customer names, emails, IPs, bodies and tokens stay out of Sentry.
        dataCollection: privacySafeDataCollection(),
        // Errors the app catches and logs (failed bookings, emails, Sabre) are reported too.
        integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
    });
    appliedKey = key;
}

/** Re-reads the admin settings when they may have changed (or immediately with force). */
export async function refreshErrorTracking(force = false): Promise<void> {
    if (!force && Date.now() - lastCheckedAt < REFRESH_MS) return;
    if (refreshing) return refreshing;

    refreshing = (async () => {
        try {
            await apply(await getActiveErrorTrackingSettings());
        } catch {
            // Never let error tracking break the app; try again next time.
        } finally {
            lastCheckedAt = Date.now();
            refreshing = null;
        }
    })();
    return refreshing;
}

/** Called once from instrumentation.ts register(). */
export async function initServerErrorTracking(): Promise<void> {
    await refreshErrorTracking(true);
    if (!timer) {
        timer = setInterval(() => void refreshErrorTracking(), REFRESH_MS);
        timer.unref?.();
    }
}

export function isErrorTrackingActive(): boolean {
    return appliedKey !== null && appliedKey !== "off";
}

export async function captureServerRequestError(
    ...args: Parameters<typeof Sentry.captureRequestError>
): Promise<void> {
    await refreshErrorTracking();
    if (!isErrorTrackingActive()) return;
    Sentry.captureRequestError(...args);
    await Sentry.flush(2000);
}

/** For the admin "Send test error" button: applies the saved settings first. */
export async function sendTestErrorEvent(actor: string): Promise<string | null> {
    await refreshErrorTracking(true);
    if (!isErrorTrackingActive()) return null;
    const eventId = Sentry.captureException(
        new Error(`Test error from Admin → Settings → Error Tracking (sent by ${actor})`),
    );
    await Sentry.flush(5000);
    return eventId;
}
