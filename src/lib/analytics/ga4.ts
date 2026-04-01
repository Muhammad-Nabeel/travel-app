import { google } from "googleapis";

import { getStoredGa4Settings } from "@/lib/admin-settings/ga4-settings";

export type AdminKpis = {
    visitors: number;
    sales: string;
    conversionRate: string;
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
    revenueBars: number[];
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
        revenueBars: [
            52, 43, 52, 18, 57, 69, 61, 43, 52, 48, 73, 78, 69, 73, 86, 61, 65, 57,
            52, 61,
        ],
        kpis: {
            visitors: 43883,
            sales: "PKR 9.8M",
            conversionRate: "3.7%",
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
                { name: "sessionConversionRate" },
            ],
        },
    });

    const barResponse = await analyticsData.properties.runReport({
        property: `properties/${config.propertyId}`,
        auth,
        requestBody: {
            dateRanges: [{ startDate: "20daysAgo", endDate: "today" }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
            limit: "20",
        },
    });

    const sourceResponse = await analyticsData.properties.runReport({
        property: `properties/${config.propertyId}`,
        auth,
        requestBody: {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "sessionDefaultChannelGroup" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: "4",
        },
    });

    const kpiValues = kpiResponse.data.rows?.[0]?.metricValues ?? [];
    const visitors = parseNumber(kpiValues[0]?.value ?? "0");
    const sessions = parseNumber(kpiValues[1]?.value ?? "0");
    const avgSessionSeconds = parseNumber(kpiValues[2]?.value ?? "0");
    const conversionRate = parseNumber(kpiValues[3]?.value ?? "0");

    const barRaw =
        barResponse.data.rows?.map((row) => parseNumber(row.metricValues?.[0]?.value ?? "0")) ?? [];
    const maxBar = Math.max(...barRaw, 1);
    const revenueBars =
        barRaw.length > 0
            ? barRaw.map((value) => Math.max(12, Math.round((value / maxBar) * 86)))
            : fallbackAnalyticsData().revenueBars;

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
                return {
                    label: row.dimensionValues?.[0]?.value || "Other",
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
        revenueBars,
        kpis: {
            visitors,
            sales: `${sessions.toLocaleString()} sessions`,
            conversionRate: `${conversionRate.toFixed(2)}%`,
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
