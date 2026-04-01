import { NextResponse } from "next/server";

import { getAdminAnalyticsData } from "@/lib/analytics/ga4";

export async function GET() {
    try {
        const data = await getAdminAnalyticsData();
        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json(
            { ok: false, error: message },
            { status: 500 },
        );
    }
}
