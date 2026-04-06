import { google } from "googleapis";

import { getStoredGa4Settings } from "@/lib/admin-settings/ga4-settings";

export type AdminKpis = {
    visitors: number;
    sessions: number;
    uniqueVisitors: number;
    avgSessionTime: string;
};

export type SourceBreakdown = {
    label: string;
    color: string;
    percent: number;
};

export type AdminAnalyticsData = {
    configured: boolean;
    source: "ga4" | "fallback";
    durationBars: number[];
    kpis: AdminKpis;
    sources: SourceBreakdown[];
    errorReason?: string;
};

export type Ga4ConnectionTestResult = {
    ok: boolean;
    message: string;
};

type ResolvedGa4Config = {
    measurementId: string;
    propertyId: string;
    serviceAccountEmail: string;
    serviceAccountPrivateKey: string;
};

type Ga4ConnectionOverrides = Partial<ResolvedGa4Config>;

function fallbackAnalyticsData(errorReason?: string): AdminAnalyticsData {
    return {
        configured: false,
        source: "fallback",
        durationBars: Array.from({ length: 30 }, (_, i) =>
            Math.max(12, 92 - i * 2),
        ),
        kpis: {
            visitors: 43883,
            sessions: 61520,
            uniqueVisitors: 36740,
            avgSessionTime: "04:12",
        },
        sources: [
            { label: "Direct", color: "#17c8b5", percent: 48 },
            { label: "Social", color: "#9f36f2", percent: 26 },
            { label: "Search", color: "#3b43ff", percent: 16 },
            { label: "Email", color: "#f4b83f", percent: 10 },
        ],
        errorReason,
    };
}

function parseNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function resolveGa4Config(
    overrides?: Ga4ConnectionOverrides,
): Promise<ResolvedGa4Config> {
    const stored = await getStoredGa4Settings();

    return {
        measurementId: (
            overrides?.measurementId ||
            stored.measurementId ||
            process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
            ""
        ).trim(),
        propertyId: (
            overrides?.propertyId ||
            stored.propertyId ||
            process.env.GA4_PROPERTY_ID ||
            ""
        ).trim(),
        serviceAccountEmail: (
            overrides?.serviceAccountEmail ||
            stored.serviceAccountEmail ||
            process.env.GA4_SERVICE_ACCOUNT_EMAIL ||
            ""
        ).trim(),
        serviceAccountPrivateKey: (
            overrides?.serviceAccountPrivateKey ||
            stored.serviceAccountPrivateKey ||
            process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY ||
            ""
        )
            .replace(/\\n/g, "\n")
            .trim(),
    };
}

function hasRequiredGa4Config(config: ResolvedGa4Config) {
    return Boolean(
        config.propertyId &&
        config.serviceAccountEmail &&
        config.serviceAccountPrivateKey,
    );
}

async function fetchGa4AnalyticsData(
    config: ResolvedGa4Config,
): Promise<AdminAnalyticsData> {
    const auth = new google.auth.JWT({
        email: config.serviceAccountEmail,
        key: config.serviceAccountPrivateKey,
        scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata("v1beta");

    const kpiResponse = await analyticsData.properties.runReport({
        property: `properties/${config.propertyId}`,
        auth,
        requestBody: {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            metrics: [
                { name: "activeUsers" },
                { name: "sessions" },
                { name: "averageSessionDuration" },
                { name: "totalUsers" },
            ],
        },
    });

    const durationResponse = await analyticsData.properties.runReport({
        property: `properties/${config.propertyId}`,
        auth,
        requestBody: {
            dateRanges: [{ startDate: "20daysAgo", endDate: "today" }],
            dimensions: [{ name: "hour" }],
            metrics: [{ name: "userEngagementDuration" }],
            orderBys: [{ dimension: { dimensionName: "hour" } }],
            limit: "24",
        },
    });

    const sourceResponse = await analyticsData.properties.runReport({
        property: `properties/${config.propertyId}`,
        auth,
        requestBody: {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: "4",
        },
    });

    const kpiValues = kpiResponse.data.rows?.[0]?.metricValues ?? [];
    const visitors = parseNumber(kpiValues[0]?.value ?? "0");
    const sessions = parseNumber(kpiValues[1]?.value ?? "0");
    const avgSessionSeconds = parseNumber(kpiValues[2]?.value ?? "0");
    const uniqueVisitors = parseNumber(kpiValues[3]?.value ?? "0");

    const durationBuckets = Array.from({ length: 24 }, () => 0);
    const durationRows = durationResponse.data.rows ?? [];
    durationRows.forEach((row) => {
        const hourValue = parseNumber(row.dimensionValues?.[0]?.value ?? "-1");
        if (hourValue < 0 || hourValue > 23) {
            return;
        }

        durationBuckets[hourValue] += parseNumber(
            row.metricValues?.[0]?.value ?? "0",
        );
    });
    const maxBucket = Math.max(...durationBuckets, 1);
    const durationBars = durationBuckets.map((value) =>
        Math.max(12, Math.round((value / maxBucket) * 86)),
    );

    const sourceColors = ["#17c8b5", "#9f36f2", "#3b43ff", "#f4b83f"];
    const sourceRows = sourceResponse.data.rows ?? [];
    const totalSourceSessions = sourceRows.reduce(
        (acc, row) => acc + parseNumber(row.metricValues?.[0]?.value ?? "0"),
        0,
    );

    const sources =
        sourceRows.length > 0 && totalSourceSessions > 0
            ? sourceRows.map((row, index) => {
                const sessionsForSource = parseNumber(row.metricValues?.[0]?.value ?? "0");
                const source = row.dimensionValues?.[0]?.value || "Unknown";
                const medium = row.dimensionValues?.[1]?.value || "";
                return {
                    label: `${source}${medium ? ` / ${medium}` : ""}`,
                    color: sourceColors[index] ?? "#9ca3af",
                    percent: Math.max(
                        1,
                        Math.round((sessionsForSource / totalSourceSessions) * 100),
                    ),
                };
            })
            : fallbackAnalyticsData().sources;

    const minutes = Math.floor(avgSessionSeconds / 60);
    const seconds = Math.floor(avgSessionSeconds % 60)
        .toString()
        .padStart(2, "0");

    return {
        configured: true,
        source: "ga4",
        durationBars: durationBars.length > 0 ? durationBars : fallbackAnalyticsData().durationBars,
        kpis: {
            visitors,
            sessions,
            uniqueVisitors,
            avgSessionTime: `${minutes.toString().padStart(2, "0")}:${seconds}`,
        },
        sources,
    };
}

async function runGa4ConnectionProbe(config: ResolvedGa4Config): Promise<void> {
    const auth = new google.auth.JWT({
        email: config.serviceAccountEmail,
        key: config.serviceAccountPrivateKey,
        scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata("v1beta");
    await analyticsData.properties.runReport({
        property: `properties/${config.propertyId}`,
        auth,
        requestBody: {
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }],
            limit: "1",
        },
    });
}

export async function testGa4Connection(
    overrides?: Ga4ConnectionOverrides,
): Promise<Ga4ConnectionTestResult> {
    const config = await resolveGa4Config(overrides);

    if (!hasRequiredGa4Config(config)) {
        return {
            ok: false,
            message:
                "GA4 is not fully configured. Add Property ID, Service Account Email, and Private Key.",
        };
    }

    try {
        await runGa4ConnectionProbe(config);
        return { ok: true, message: "GA4 connection is successful." };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown GA4 connection error.";
        return { ok: false, message };
    }
}

export async function getAdminAnalyticsData(): Promise<AdminAnalyticsData> {
    const config = await resolveGa4Config();
    const configured = hasRequiredGa4Config(config);

    if (!configured) {
        return fallbackAnalyticsData(
            "GA4 credentials are incomplete. Showing fallback analytics.",
        );
    }

    try {
        return await fetchGa4AnalyticsData(config);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown GA4 fetch error.";
        return fallbackAnalyticsData(
            `GA4 request failed: ${message}. Showing fallback analytics.`,
        );
    }
}
