import type { Instrumentation } from "next";

/**
 * Error tracking (Sentry) for the Node.js server. Configured entirely from
 * Admin → Settings → Error Tracking; nothing is sent until it is enabled there.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { initServerErrorTracking } = await import("@/lib/error-tracking/server");
        await initServerErrorTracking();
    }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const { captureServerRequestError } = await import("@/lib/error-tracking/server");
    await captureServerRequestError(error, request, context);
};
