import { NextResponse } from "next/server";

import { getStoredSitePricingSettings } from "@/lib/admin-settings/site-pricing-settings";

export async function GET() {
    try {
        const settings = await getStoredSitePricingSettings();
        return NextResponse.json(settings, { status: 200 });
    } catch {
        return NextResponse.json(
            { serviceChargePercent: 0 },
            { status: 200 },
        );
    }
}
