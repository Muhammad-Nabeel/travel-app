import { NextRequest, NextResponse } from "next/server";

import {
    getStoredErrorTrackingSettings,
    normalizeErrorTrackingSettings,
    saveStoredErrorTrackingSettings,
} from "@/lib/admin-settings/error-tracking-settings";
import { refreshErrorTracking } from "@/lib/error-tracking/server";
import { revalidatePublicSite } from "@/lib/revalidate-site";

/** Sentry error tracking (Admin → Settings → Error Tracking). */
export async function GET() {
    try {
        return NextResponse.json(await getStoredErrorTrackingSettings());
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        await saveStoredErrorTrackingSettings(normalizeErrorTrackingSettings(body));

        // This process switches now; others pick it up within 5 minutes.
        await refreshErrorTracking(true);
        // Pages carry the browser DSN, so cached pages are re-rendered.
        revalidatePublicSite();

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
