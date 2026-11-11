// What the site tracks per service and which GTM tags/triggers it needs.
// Shown in Admin → Settings → Site Analytics and used to generate the GTM
// container download. Client-safe: no server imports.
//
// Trigger IDs and names must match src/lib/analytics/gtm-container-base.json.

/** Google Ads conversion actions the container can include, one per service outcome. */
export const ADS_CONVERSIONS = [
    {
        key: "flightBooking",
        label: "Flight booking",
        triggerId: "109",
        triggerName: "CE - Flight booking (purchase)",
        value: "booking",
    },
    {
        key: "flightLead",
        label: "Flight enquiry",
        triggerId: "103",
        triggerName: "CE - Lead - Flight enquiry",
        value: "none",
    },
    {
        key: "hotelLead",
        label: "Hotel enquiry",
        triggerId: "104",
        triggerName: "CE - Lead - Hotel enquiry",
        value: "none",
    },
    {
        key: "umrahLead",
        label: "Umrah enquiry",
        triggerId: "105",
        triggerName: "CE - Lead - Umrah enquiry",
        value: "lead",
    },
    {
        key: "tourLead",
        label: "Tour enquiry",
        triggerId: "106",
        triggerName: "CE - Lead - Tour enquiry",
        value: "lead",
    },
    {
        key: "visaLead",
        label: "Visa enquiry",
        triggerId: "107",
        triggerName: "CE - Lead - Visa enquiry",
        value: "none",
    },
    {
        key: "contactLead",
        label: "Contact form or chat",
        triggerId: "108",
        triggerName: "CE - Lead - Contact form or chat",
        value: "none",
    },
] as const satisfies readonly {
    key: string;
    label: string;
    triggerId: string;
    triggerName: string;
    /** booking = ecommerce value + booking reference; lead = estimated value; none = no value. */
    value: "booking" | "lead" | "none";
}[];

export type AdsConversionKey = (typeof ADS_CONVERSIONS)[number]["key"];

export const ADS_CONVERSION_KEYS = ADS_CONVERSIONS.map((c) => c.key) as AdsConversionKey[];

export function adsTagName(label: string) {
    return `Ads - ${label}`;
}

export const GA4_EVENT_TAGS = {
    ecommerce: {
        name: "GA4 Event - Ecommerce",
        triggerName: "CE - GA4 ecommerce events",
        events: ["select_item", "begin_checkout", "add_payment_info", "purchase"],
    },
    standard: {
        name: "GA4 Event - Standard",
        triggerName: "CE - GA4 standard events",
        events: ["search", "payment_page_viewed", "generate_lead", "contact_click", "sign_up"],
    },
} as const;

export type TrackedEvent = {
    name: string;
    when: string;
    params?: string;
};

export type ServiceTrackingGuide = {
    key: string;
    label: string;
    summary: string;
    events: TrackedEvent[];
    /** Trigger in the container that isolates this service (for ad conversion tags). */
    triggers: { name: string; condition: string }[];
    /** GA4 key events to create in GA4 → Admin → Events → Create event. */
    keyEvents: { name: string; condition: string }[];
    ads: AdsConversionKey[];
    test: string;
};

export const SERVICE_TRACKING: ServiceTrackingGuide[] = [
    {
        key: "flights",
        label: "Flights",
        summary: "Full booking funnel from search to confirmed booking request, plus the enquiry form.",
        events: [
            { name: "search", when: "Flight search submitted", params: "search_type=flight, trip_type, origin, destination, dates, cabin_class, passengers" },
            { name: "select_item", when: "Book clicked on a result", params: "ecommerce (value, currency, items), stops" },
            { name: "begin_checkout", when: "Passenger details submitted", params: "ecommerce, trip_type, passenger_count" },
            { name: "payment_page_viewed", when: "Payment page opened", params: "trip_type, origin, destination, value, currency" },
            { name: "add_payment_info", when: "Pay clicked with a payment method", params: "ecommerce incl. payment_type" },
            { name: "purchase", when: "Booking request saved (Cash on Delivery / Pay at Branch)", params: "ecommerce incl. transaction_id = booking reference" },
            { name: "generate_lead", when: "Flight enquiry form sent", params: "lead_type=flight, lead_source=enquiry_form, item_name" },
        ],
        triggers: [
            { name: "CE - Flight booking (purchase)", condition: "Custom Event equals purchase" },
            { name: "CE - Lead - Flight enquiry", condition: "Custom Event equals generate_lead AND DLV - lead_type equals flight" },
        ],
        keyEvents: [
            { name: "purchase", condition: "Already sent by the site: just mark it as a key event" },
            { name: "lead_flight", condition: "event_name equals generate_lead AND lead_type equals flight" },
        ],
        ads: ["flightBooking", "flightLead"],
        test: "Search a flight → Book a result → fill passengers → choose Pay at Branch or Cash on Delivery → confirm. Expect all six funnel events, then purchase.",
    },
    {
        key: "hotels",
        label: "Hotels",
        summary: "Enquiry lead when the hotel enquiry form on /hotels is sent.",
        events: [
            { name: "generate_lead", when: "Hotel enquiry form sent", params: "lead_type=hotel, lead_source=enquiry_form, item_name (stay type, destination, dates)" },
        ],
        triggers: [
            { name: "CE - Lead - Hotel enquiry", condition: "Custom Event equals generate_lead AND DLV - lead_type equals hotel" },
        ],
        keyEvents: [
            { name: "lead_hotel", condition: "event_name equals generate_lead AND lead_type equals hotel" },
        ],
        ads: ["hotelLead"],
        test: "Open /hotels and submit the enquiry form. Expect generate_lead with lead_type = hotel.",
    },
    {
        key: "umrah",
        label: "Umrah",
        summary: "Enquiry lead with the package's estimated value.",
        events: [
            { name: "generate_lead", when: "Umrah package enquiry sent", params: "lead_type=umrah, item_name (package), value, currency" },
        ],
        triggers: [
            { name: "CE - Lead - Umrah enquiry", condition: "Custom Event equals generate_lead AND DLV - lead_type equals umrah" },
        ],
        keyEvents: [
            { name: "lead_umrah", condition: "event_name equals generate_lead AND lead_type equals umrah" },
        ],
        ads: ["umrahLead"],
        test: "Open any Umrah package and submit its enquiry form. Expect generate_lead with lead_type = umrah and a value.",
    },
    {
        key: "tours",
        label: "Tours",
        summary: "Enquiry lead with the tour's estimated value.",
        events: [
            { name: "generate_lead", when: "Tour package enquiry sent", params: "lead_type=tour, item_name (package), value, currency" },
        ],
        triggers: [
            { name: "CE - Lead - Tour enquiry", condition: "Custom Event equals generate_lead AND DLV - lead_type equals tour" },
        ],
        keyEvents: [
            { name: "lead_tour", condition: "event_name equals generate_lead AND lead_type equals tour" },
        ],
        ads: ["tourLead"],
        test: "Open any tour package and submit its enquiry form. Expect generate_lead with lead_type = tour and a value.",
    },
    {
        key: "visa",
        label: "Visa",
        summary: "Enquiry lead from a visa country page.",
        events: [
            { name: "generate_lead", when: "Visa enquiry sent", params: "lead_type=visa, item_name (country and visa type)" },
        ],
        triggers: [
            { name: "CE - Lead - Visa enquiry", condition: "Custom Event equals generate_lead AND DLV - lead_type equals visa" },
        ],
        keyEvents: [
            { name: "lead_visa", condition: "event_name equals generate_lead AND lead_type equals visa" },
        ],
        ads: ["visaLead"],
        test: "Open any visa country page and submit the enquiry. Expect generate_lead with lead_type = visa.",
    },
    {
        key: "contact",
        label: "Contact & sign-up",
        summary: "Contact form, chat widget, phone/WhatsApp/email clicks and account sign-ups.",
        events: [
            { name: "generate_lead", when: "Contact form or chat lead sent", params: "lead_type=contact or chat, lead_source" },
            { name: "contact_click", when: "Phone, WhatsApp or email link clicked", params: "method (never the number)" },
            { name: "sign_up", when: "Account created with email", params: "method=email" },
        ],
        triggers: [
            { name: "CE - Lead - Contact form or chat", condition: "Custom Event equals generate_lead AND DLV - lead_type matches contact|chat" },
        ],
        keyEvents: [
            { name: "lead_contact", condition: "event_name equals generate_lead AND lead_type matches regex contact|chat" },
            { name: "sign_up", condition: "Already sent by the site: mark it as a key event if wanted" },
        ],
        ads: ["contactLead"],
        test: "Submit /contact-us and click a phone or WhatsApp link. Expect generate_lead (contact) and contact_click.",
    },
];

/** GA4 custom dimensions (Admin → Custom definitions, scope Event). */
export const GA4_CUSTOM_DIMENSIONS = [
    ["Lead type", "lead_type"],
    ["Lead source", "lead_source"],
    ["Search type", "search_type"],
    ["Trip type", "trip_type"],
    ["Origin", "origin"],
    ["Destination", "destination"],
    ["Cabin class", "cabin_class"],
    ["Contact method", "method"],
    ["Search surface", "search_surface"],
] as const;
