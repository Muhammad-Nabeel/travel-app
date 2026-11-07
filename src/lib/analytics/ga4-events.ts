// Browser-side event tracking for GA4 (gtag.js) and Google Tag Manager.
// No "use client" directive: this module is also imported by shared helpers
// such as service-requests.ts, and every function is a no-op on the server.

import type { FlightOffer, FlightSearchQuery } from "@/lib/flights/types";

type AnalyticsProvider = "ga4" | "gtm";
type EventParams = Record<string, unknown>;

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        /** Events sent before gtag.js is ready; flushed by the GA4 loader script. */
        __ga4Queue?: Array<[string, EventParams]>;
    }
}

/** GA4 recommended ecommerce item. */
export type AnalyticsItem = {
    item_id: string;
    item_name: string;
    item_brand?: string;
    item_category?: string;
    item_variant?: string;
    price?: number;
    quantity?: number;
};

export type EcommerceParams = {
    currency: string;
    value: number;
    items: AnalyticsItem[];
    transaction_id?: string;
    payment_type?: string;
    item_list_id?: string;
    item_list_name?: string;
};

export type LeadType =
    | "flight"
    | "hotel"
    | "umrah"
    | "visa"
    | "tour"
    | "contact"
    | "chat";

// The root layout writes the active provider onto <html data-analytics>, so
// events are routed correctly even before the tag script has loaded.
function getProvider(): AnalyticsProvider | null {
    if (typeof document === "undefined") {
        return null;
    }

    const provider = document.documentElement.dataset.analytics;
    return provider === "gtm" || provider === "ga4" ? provider : null;
}

function sendToGa4(eventName: string, params: EventParams) {
    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
        return;
    }

    window.__ga4Queue = window.__ga4Queue ?? [];
    window.__ga4Queue.push([eventName, params]);
}

function pushToDataLayer(entry: EventParams) {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(entry);
}

export function trackEvent(eventName: string, params: EventParams = {}) {
    const provider = getProvider();

    if (provider === "gtm") {
        pushToDataLayer({ event: eventName, ...params });
    } else if (provider === "ga4") {
        sendToGa4(eventName, params);
    }
}

/**
 * Ecommerce events (select_item, begin_checkout, add_payment_info, purchase).
 * GTM receives the standard `ecommerce` object; gtag.js receives it flat.
 */
export function trackEcommerceEvent(
    eventName: string,
    ecommerce: EcommerceParams,
    params: EventParams = {},
) {
    const provider = getProvider();

    if (provider === "gtm") {
        // Clear the previous ecommerce object so values never merge across events.
        pushToDataLayer({ ecommerce: null });
        pushToDataLayer({ event: eventName, ...params, ecommerce });
    } else if (provider === "ga4") {
        sendToGa4(eventName, { ...params, ...ecommerce });
    }
}

/** Never pass form fields (name, email, phone) here: GA4 forbids PII. */
export function trackLead(
    leadType: LeadType,
    params: {
        leadSource: string;
        itemName?: string;
        value?: number;
        currency?: string;
    },
) {
    const hasValue =
        typeof params.value === "number" &&
        Number.isFinite(params.value) &&
        params.value > 0 &&
        Boolean(params.currency);

    trackEvent("generate_lead", {
        lead_type: leadType,
        lead_source: params.leadSource,
        ...(params.itemName ? { item_name: params.itemName } : {}),
        ...(hasValue ? { value: params.value, currency: params.currency } : {}),
    });
}

export function buildFlightItem(
    offer: Pick<FlightOffer, "airline" | "origin" | "destination" | "currency">,
    query: Pick<FlightSearchQuery, "tripType" | "cabinClass">,
    price: number,
): AnalyticsItem {
    return {
        item_id: `${offer.origin}-${offer.destination}`,
        item_name: `Flight ${offer.origin} to ${offer.destination}`,
        item_brand: offer.airline,
        item_category: "flight",
        item_variant: `${query.tripType} ${query.cabinClass}`,
        price,
        quantity: 1,
    };
}
