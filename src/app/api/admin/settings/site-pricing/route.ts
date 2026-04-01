import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSitePricingSettings,
    saveStoredSitePricingSettings,
} from "@/lib/admin-settings/site-pricing-settings";

export async function GET() {
    try {
        const settings = await getStoredSitePricingSettings();
        return NextResponse.json(settings, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            serviceChargePercent?: number;
        };

        const saved = await saveStoredSitePricingSettings({
            serviceChargePercent: body.serviceChargePercent ?? 0,
        });

        return NextResponse.json(saved, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
