// Tracking Report (Admin → Tracking Report): reads GA4 with the stored
// Dashboard Analytics connection and compares what the site is meant to send
// (gtm-plan.ts) with what GA4 actually received.

import { analyticsdata } from "googleapis/build/src/apis/analyticsdata";

import { getGa4ReportingClient, type Ga4ReportingClient } from "@/lib/analytics/ga4";
import { GA4_EVENT_TAGS, SERVICE_TRACKING } from "@/lib/analytics/gtm-plan";
import type {
    FunnelStep,
    ReportRange,
    ServiceRow,
    TrackingReport,
} from "@/lib/analytics/tracking-report-types";

export { parseReportRange } from "@/lib/analytics/tracking-report-types";

const EXPECTED_EVENTS: string[] = [
    ...GA4_EVENT_TAGS.ecommerce.events,
    ...GA4_EVENT_TAGS.standard.events,
];

const FUNNEL: { event: string; label: string }[] = [
    { event: "search", label: "Flight search" },
    { event: "select_item", label: "Result selected" },
    { event: "begin_checkout", label: "Passenger details" },
    { event: "payment_page_viewed", label: "Payment page" },
    { event: "add_payment_info", label: "Payment method" },
    { event: "purchase", label: "Booking saved" },
];

type Counts = Map<string, number>;

const analyticsData = analyticsdata("v1beta");

/** Plain-language reason for a failed GA4 request. */
function explain(err: unknown, section: string): string {
    const message = err instanceof Error ? err.message : String(err);
    const missingDimension = message.match(/customEvent:([a-z_]+)/i);
    if (/not a valid dimension/i.test(message) && missingDimension) {
        return `${section}: register the custom dimension "${missingDimension[1]}" in GA4 (Admin → Custom definitions, scope Event). Data starts from the day it is created.`;
    }
    if (/permission|403/i.test(message)) {
        return `${section}: the service account has no access to this GA4 property. Add it as a Viewer in GA4 → Admin → Property access management.`;
    }
    return `${section}: ${message}`;
}

function toCounts(rows: { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null }[] | null | undefined): Counts {
    const counts: Counts = new Map();
    for (const row of rows ?? []) {
        const key = row.dimensionValues?.[0]?.value ?? "";
        const value = Number(row.metricValues?.[0]?.value ?? 0);
        if (key) counts.set(key, (counts.get(key) ?? 0) + (Number.isFinite(value) ? value : 0));
    }
    return counts;
}

async function countBy(
    client: Ga4ReportingClient,
    days: ReportRange,
    dimension: string,
    metric: string,
    eventName?: string,
): Promise<Counts> {
    const res = await analyticsData.properties.runReport({
        property: client.property,
        auth: client.auth,
        requestBody: {
            dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
            dimensions: [{ name: dimension }],
            metrics: [{ name: metric }],
            ...(eventName
                ? {
                      dimensionFilter: {
                          filter: { fieldName: "eventName", stringFilter: { value: eventName } },
                      },
                  }
                : {}),
            limit: "250",
        },
    });
    return toCounts(res.data.rows);
}

async function realtimeCounts(client: Ga4ReportingClient): Promise<Counts> {
    const res = await analyticsData.properties.runRealtimeReport({
        property: client.property,
        auth: client.auth,
        requestBody: {
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }],
            limit: "250",
        },
    });
    return toCounts(res.data.rows);
}

function describeEvents(): Map<string, { descriptions: string[]; services: string[] }> {
    const info = new Map<string, { descriptions: string[]; services: string[] }>();
    for (const name of EXPECTED_EVENTS) info.set(name, { descriptions: [], services: [] });
    for (const service of SERVICE_TRACKING) {
        for (const event of service.events) {
            const entry = info.get(event.name);
            if (!entry) continue;
            if (!entry.descriptions.includes(event.when)) entry.descriptions.push(event.when);
            if (!entry.services.includes(service.label)) entry.services.push(service.label);
        }
    }
    return info;
}

function pick(counts: Counts | null, ...keys: string[]): number | null {
    if (!counts) return null;
    return keys.reduce((sum, key) => sum + (counts.get(key) ?? 0), 0);
}

function buildServices(
    events: Counts,
    searches: Counts | null,
    leads: Counts | null,
    views: Counts | null,
): ServiceRow[] {
    return [
        {
            key: "flights",
            label: "Flights",
            metrics: [
                { label: "Searches", value: pick(searches, "flight") },
                { label: "Enquiries", value: pick(leads, "flight") },
                { label: "Bookings", value: events.get("purchase") ?? 0 },
            ],
        },
        {
            key: "hotels",
            label: "Hotels",
            metrics: [
                { label: "Searches", value: pick(searches, "hotel") },
                { label: "Enquiries", value: pick(leads, "hotel") },
            ],
        },
        {
            key: "umrah",
            label: "Umrah",
            metrics: [
                { label: "Package views", value: pick(views, "umrah") },
                { label: "Enquiries", value: pick(leads, "umrah") },
            ],
        },
        {
            key: "tours",
            label: "Tours",
            metrics: [
                { label: "Searches", value: pick(searches, "tour") },
                { label: "Package views", value: pick(views, "tour") },
                { label: "Enquiries", value: pick(leads, "tour") },
            ],
        },
        {
            key: "visa",
            label: "Visa",
            metrics: [
                { label: "Searches", value: pick(searches, "visa") },
                { label: "Page views", value: pick(views, "visa") },
                { label: "Enquiries", value: pick(leads, "visa") },
            ],
        },
        {
            key: "contact",
            label: "Contact & sign-up",
            metrics: [
                { label: "Form & chat leads", value: pick(leads, "contact", "chat") },
                { label: "Phone/WhatsApp/email clicks", value: events.get("contact_click") ?? 0 },
                { label: "Sign-ups", value: events.get("sign_up") ?? 0 },
            ],
        },
    ];
}

function buildFunnel(events: Counts, searches: Counts | null): FunnelStep[] | null {
    // Step 1 must be flight searches only; without search_type it can't be split out.
    const flightSearches = pick(searches, "flight");
    if (flightSearches === null) return null;

    const counts = FUNNEL.map((step, index) =>
        index === 0 ? flightSearches : (events.get(step.event) ?? 0),
    );
    const first = counts[0];
    return FUNNEL.map((step, index) => ({
        ...step,
        count: counts[index],
        percent: first > 0 ? Math.round((counts[index] / first) * 1000) / 10 : 0,
    }));
}

export async function getTrackingReport(days: ReportRange): Promise<TrackingReport> {
    const client = await getGa4ReportingClient();
    if (!client) {
        return {
            configured: false,
            reason: "GA4 is not connected. Add the Property ID, Service Account Email and Private Key in Admin → Settings → Dashboard Analytics.",
        };
    }

    const [eventsRes, searchesRes, leadsRes, viewsRes, liveRes] = await Promise.allSettled([
        countBy(client, days, "eventName", "eventCount"),
        countBy(client, days, "customEvent:search_type", "eventCount", "search"),
        countBy(client, days, "customEvent:lead_type", "eventCount", "generate_lead"),
        countBy(client, days, "itemCategory", "itemsViewed"),
        realtimeCounts(client),
    ]);

    // Without the main event counts nothing else is meaningful.
    if (eventsRes.status === "rejected") {
        return { configured: false, reason: explain(eventsRes.reason, "GA4 request failed") };
    }

    const warnings: string[] = [];
    const settled = (res: PromiseSettledResult<Counts>, section: string) => {
        if (res.status === "fulfilled") return res.value;
        warnings.push(explain(res.reason, section));
        return null;
    };

    const events = eventsRes.value;
    const searches = settled(searchesRes, "Searches by service");
    const leads = settled(leadsRes, "Enquiries by service");
    const views = settled(viewsRes, "Package views by service");
    const live = settled(liveRes, "Live events");

    const info = describeEvents();
    const expected = new Set(EXPECTED_EVENTS);

    return {
        configured: true,
        days,
        generatedAt: new Date().toISOString(),
        events: EXPECTED_EVENTS.map((name) => ({
            name,
            descriptions: info.get(name)?.descriptions ?? [],
            services: info.get(name)?.services ?? [],
            count: events.get(name) ?? 0,
            liveCount: live ? (live.get(name) ?? 0) : null,
        })),
        otherEvents: [...events.entries()]
            .filter(([name]) => !expected.has(name))
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
        services: buildServices(events, searches, leads, views),
        funnel: buildFunnel(events, searches),
        warnings,
    };
}
