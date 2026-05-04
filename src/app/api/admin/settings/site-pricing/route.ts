import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSitePricingSettings,
    saveStoredSitePricingSettings,
} from "@/lib/admin-settings/site-pricing-settings";
import { getWiseRuntimeStatus } from "@/lib/payments/wise-config";

export async function GET() {
    try {
        const settings = await getStoredSitePricingSettings();
        const wise = getWiseRuntimeStatus();
        return NextResponse.json(
            {
                ...settings,
                wiseConfigured: wise.configured,
                wiseMissingKeys: wise.missingKeys,
                wiseEnvironment: wise.environment,
                wiseWebhookSecretConfigured: wise.webhookSecretConfigured,
                wiseWebhookPath: wise.webhookPath,
            },
            { status: 200 },
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            serviceChargePercent?: number;
            enableWise?: boolean;
            enableStripe?: boolean;
            enablePaypal?: boolean;
            enableSumup?: boolean;
            enablePaymob?: boolean;
            enableCashOnDelivery?: boolean;
            enablePayAtBranch?: boolean;
        };

        const saved = await saveStoredSitePricingSettings({
            serviceChargePercent: body.serviceChargePercent ?? 0,
            enableWise: body.enableWise ?? true,
            enableStripe: body.enableStripe ?? true,
            enablePaypal: body.enablePaypal ?? true,
            enableSumup: body.enableSumup ?? true,
            enablePaymob: body.enablePaymob ?? true,
            enableCashOnDelivery: body.enableCashOnDelivery ?? true,
            enablePayAtBranch: body.enablePayAtBranch ?? true,
        });

        return NextResponse.json(saved, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
