import { NextResponse } from "next/server";

import { getStoredSitePricingSettings } from "@/lib/admin-settings/site-pricing-settings";
import { getWiseRuntimeStatus } from "@/lib/payments/wise-config";

export async function GET() {
    try {
        const settings = await getStoredSitePricingSettings();
        const wise = getWiseRuntimeStatus();
        return NextResponse.json(
            {
                ...settings,
                wiseConfigured: wise.configured,
                wiseCheckoutUrl: wise.checkoutUrl,
            },
            { status: 200 },
        );
    } catch {
        const wise = getWiseRuntimeStatus();
        return NextResponse.json(
            {
                serviceChargePercent: 0,
                enableWise: true,
                enableStripe: true,
                enablePaypal: true,
                enableSumup: true,
                enablePaymob: true,
                enableCashOnDelivery: true,
                enablePayAtBranch: true,
                wiseConfigured: wise.configured,
                wiseCheckoutUrl: wise.checkoutUrl,
            },
            { status: 200 },
        );
    }
}
