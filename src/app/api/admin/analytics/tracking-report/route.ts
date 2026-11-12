import { NextResponse, type NextRequest } from "next/server";

import { getTrackingReport, parseReportRange } from "@/lib/analytics/tracking-report";

/** Tracking Report data for Admin → Tracking Report. Admin-only via proxy.ts. */
export async function GET(req: NextRequest) {
    try {
        const days = parseReportRange(req.nextUrl.searchParams.get("days"));
        const report = await getTrackingReport(days);
        return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ configured: false, reason: message }, { status: 500 });
    }
}
