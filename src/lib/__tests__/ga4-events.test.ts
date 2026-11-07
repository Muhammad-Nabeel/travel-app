/**
 * @jest-environment jsdom
 */
import {
    buildFlightItem,
    trackEcommerceEvent,
    trackEvent,
    trackLead,
} from "@/lib/analytics/ga4-events";

const ecommerce = {
    currency: "PKR",
    value: 185000,
    transaction_id: "BK-123",
    items: [{ item_id: "LHE-JED", item_name: "Flight LHE to JED", price: 185000, quantity: 1 }],
};

function setProvider(provider?: "ga4" | "gtm") {
    if (provider) {
        document.documentElement.dataset.analytics = provider;
    } else {
        delete document.documentElement.dataset.analytics;
    }
}

beforeEach(() => {
    setProvider();
    delete window.dataLayer;
    delete window.gtag;
    delete window.__ga4Queue;
});

describe("GTM provider", () => {
    beforeEach(() => setProvider("gtm"));

    it("pushes events to dataLayer even before GTM has loaded", () => {
        trackEvent("contact_click", { method: "whatsapp" });
        expect(window.dataLayer).toEqual([{ event: "contact_click", method: "whatsapp" }]);
    });

    it("clears the previous ecommerce object before an ecommerce event", () => {
        trackEcommerceEvent("purchase", ecommerce, { trip_type: "one-way" });
        expect(window.dataLayer).toEqual([
            { ecommerce: null },
            { event: "purchase", trip_type: "one-way", ecommerce },
        ]);
    });
});

describe("GA4 provider", () => {
    beforeEach(() => setProvider("ga4"));

    it("queues events until gtag.js is ready", () => {
        trackEvent("search", { search_term: "LHE-JED" });
        expect(window.__ga4Queue).toEqual([["search", { search_term: "LHE-JED" }]]);
        expect(window.dataLayer).toBeUndefined();
    });

    it("sends ecommerce params flat through gtag", () => {
        const gtag = jest.fn();
        window.gtag = gtag;
        trackEcommerceEvent("purchase", ecommerce);
        expect(gtag).toHaveBeenCalledWith("event", "purchase", ecommerce);
    });
});

it("does nothing when no analytics provider is configured", () => {
    trackEvent("search");
    expect(window.dataLayer).toBeUndefined();
    expect(window.__ga4Queue).toBeUndefined();
});

describe("trackLead", () => {
    beforeEach(() => setProvider("gtm"));

    it("sends value only when it is a positive amount with a currency", () => {
        trackLead("umrah", { leadSource: "enquiry_form", itemName: "Umrah 15 nights", value: 450000, currency: "PKR" });
        trackLead("contact", { leadSource: "contact_form", value: 0, currency: "PKR" });
        expect(window.dataLayer).toEqual([
            {
                event: "generate_lead",
                lead_type: "umrah",
                lead_source: "enquiry_form",
                item_name: "Umrah 15 nights",
                value: 450000,
                currency: "PKR",
            },
            { event: "generate_lead", lead_type: "contact", lead_source: "contact_form" },
        ]);
    });
});

it("builds a GA4 flight item from an offer", () => {
    expect(
        buildFlightItem(
            { airline: "PIA", origin: "LHE", destination: "JED", currency: "PKR" },
            { tripType: "round-trip", cabinClass: "Economy" },
            185000,
        ),
    ).toEqual({
        item_id: "LHE-JED",
        item_name: "Flight LHE to JED",
        item_brand: "PIA",
        item_category: "flight",
        item_variant: "round-trip Economy",
        price: 185000,
        quantity: 1,
    });
});
