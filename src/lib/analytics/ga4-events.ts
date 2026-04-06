"use client";

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

export function trackGa4Event(
    eventName: string,
    params: Record<string, unknown> = {},
) {
    if (typeof window === "undefined") {
        return;
    }

    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
        return;
    }

    if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...params });
    }
}
