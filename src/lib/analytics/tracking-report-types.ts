// Types and options shared by the Tracking Report API and admin page.
// Client-safe: no server imports.

export const REPORT_RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export function parseReportRange(value: unknown): ReportRange {
    const days = Number(value);
    return (REPORT_RANGES as readonly number[]).includes(days) ? (days as ReportRange) : 30;
}

export type TrackedEventRow = {
    name: string;
    /** When the site sends it, from the tracking plan. */
    descriptions: string[];
    services: string[];
    count: number;
    /** Events in the last 30 minutes; null when the realtime report failed. */
    liveCount: number | null;
};

/** null value = GA4 could not report it (see `note`). */
export type ServiceMetric = { label: string; value: number | null };

export type ServiceRow = {
    key: string;
    label: string;
    metrics: ServiceMetric[];
};

export type FunnelStep = { event: string; label: string; count: number; percent: number };

export type TrackingReport =
    | { configured: false; reason: string }
    | {
          configured: true;
          days: ReportRange;
          generatedAt: string;
          events: TrackedEventRow[];
          /** Events GA4 received that are not in the tracking plan (page_view, scroll, ...). */
          otherEvents: { name: string; count: number }[];
          services: ServiceRow[];
          funnel: FunnelStep[] | null;
          /** Problems with individual sections; the rest of the report still loads. */
          warnings: string[];
      };
