import { NextResponse } from "next/server";

import { getStoredSiteAnalyticsSettings } from "@/lib/admin-settings/ga4-settings";
import { buildGtmContainer } from "@/lib/analytics/gtm-container";

/** Downloads the GTM container (Admin → Import Container) built from the saved settings. */
export async function GET() {
    try {
        const settings = await getStoredSiteAnalyticsSettings();
        const container = buildGtmContainer(settings);
        const id = (settings.gtmContainerId || "container").toLowerCase();

        return new NextResponse(JSON.stringify(container, null, 2), {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Content-Disposition": `attachment; filename="gtm-${id}-import.json"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
