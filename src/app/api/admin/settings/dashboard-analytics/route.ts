import { NextRequest, NextResponse } from "next/server";

import {
    getStoredDashboardAnalyticsSettings,
    normalizeDashboardAnalyticsSettings,
    saveStoredDashboardAnalyticsSettings,
    type DashboardAnalyticsSettings,
} from "@/lib/admin-settings/ga4-settings";
import { testGa4Connection } from "@/lib/analytics/ga4";

/** Merges the submitted form with stored values; a blank private key keeps the stored one. */
async function resolveSubmitted(body: Record<string, unknown>): Promise<DashboardAnalyticsSettings> {
    const existing = await getStoredDashboardAnalyticsSettings();
    const submitted = normalizeDashboardAnalyticsSettings(body);
    return {
        ...submitted,
        serviceAccountPrivateKey:
            submitted.serviceAccountPrivateKey || existing.serviceAccountPrivateKey,
    };
}

/** GA4 Data API credentials used by the admin dashboard reports. `?test=true` checks the saved ones. */
export async function GET(request: NextRequest) {
    try {
        if (request.nextUrl.searchParams.get("test") === "true") {
            const result = await testGa4Connection();
            return NextResponse.json(result, { status: result.ok ? 200 : 400 });
        }

        const { serviceAccountPrivateKey, ...rest } = await getStoredDashboardAnalyticsSettings();
        return NextResponse.json({ ...rest, hasPrivateKey: Boolean(serviceAccountPrivateKey) });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        await saveStoredDashboardAnalyticsSettings(await resolveSubmitted(body));
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}

/** `?test=true` checks the submitted (unsaved) credentials. */
export async function POST(request: NextRequest) {
    try {
        if (request.nextUrl.searchParams.get("test") !== "true") {
            return NextResponse.json(
                { ok: false, message: "Unsupported operation." },
                { status: 400 },
            );
        }

        const body = (await request.json()) as Record<string, unknown>;
        const result = await testGa4Connection(await resolveSubmitted(body));
        return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}
