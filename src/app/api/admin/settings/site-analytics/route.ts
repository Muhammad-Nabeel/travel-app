import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSiteAnalyticsSettings,
    normalizeSiteAnalyticsSettings,
    saveStoredSiteAnalyticsSettings,
} from "@/lib/admin-settings/ga4-settings";

/** Tracking tag (GA4 or GTM) loaded on every public page. */
export async function GET() {
    try {
        return NextResponse.json(await getStoredSiteAnalyticsSettings());
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        await saveStoredSiteAnalyticsSettings(normalizeSiteAnalyticsSettings(body));
        // The root layout embeds the tag IDs on every page.
        revalidatePath("/", "layout");

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
