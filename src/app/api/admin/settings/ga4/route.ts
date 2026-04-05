import { NextRequest, NextResponse } from "next/server";

import {
    getStoredGa4Settings,
    saveStoredGa4Settings,
} from "@/lib/admin-settings/ga4-settings";
import { testGa4Connection } from "@/lib/analytics/ga4";

export async function GET(request: NextRequest) {
    try {
        const shouldTest = request.nextUrl.searchParams.get("test") === "true";

        if (shouldTest) {
            const result = await testGa4Connection();
            return NextResponse.json(result, { status: result.ok ? 200 : 400 });
        }

        const settings = await getStoredGa4Settings();
        return NextResponse.json({
            provider: settings.provider,
            gtmContainerId: settings.gtmContainerId,
            measurementId: settings.measurementId,
            propertyId: settings.propertyId,
            serviceAccountEmail: settings.serviceAccountEmail,
            hasPrivateKey: Boolean(settings.serviceAccountPrivateKey),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            provider?: "ga4" | "gtm";
            gtmContainerId?: string;
            measurementId?: string;
            propertyId?: string;
            serviceAccountEmail?: string;
            serviceAccountPrivateKey?: string;
        };

        const existing = await getStoredGa4Settings();

        await saveStoredGa4Settings({
            provider: body.provider === "gtm" ? "gtm" : "ga4",
            gtmContainerId: body.gtmContainerId?.trim() ?? "",
            measurementId: body.measurementId?.trim() ?? "",
            propertyId: body.propertyId?.trim() ?? "",
            serviceAccountEmail: body.serviceAccountEmail?.trim() ?? "",
            serviceAccountPrivateKey:
                body.serviceAccountPrivateKey?.trim() || existing.serviceAccountPrivateKey,
        });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const shouldTest = request.nextUrl.searchParams.get("test") === "true";
        if (!shouldTest) {
            return NextResponse.json(
                { ok: false, message: "Unsupported operation." },
                { status: 400 },
            );
        }

        const body = (await request.json()) as {
            provider?: "ga4" | "gtm";
            gtmContainerId?: string;
            measurementId?: string;
            propertyId?: string;
            serviceAccountEmail?: string;
            serviceAccountPrivateKey?: string;
        };

        if (body.provider === "gtm") {
            return NextResponse.json(
                {
                    ok: true,
                    message: "Google Tag Manager selected. No GA4 API credential test required.",
                },
                { status: 200 },
            );
        }

        const existing = await getStoredGa4Settings();

        const result = await testGa4Connection({
            measurementId: body.measurementId?.trim() ?? "",
            propertyId: body.propertyId?.trim() ?? "",
            serviceAccountEmail: body.serviceAccountEmail?.trim() ?? "",
            serviceAccountPrivateKey:
                body.serviceAccountPrivateKey?.trim() || existing.serviceAccountPrivateKey,
        });

        return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}
