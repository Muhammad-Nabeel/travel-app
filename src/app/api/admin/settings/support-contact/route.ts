import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSupportContactSettings,
    saveStoredSupportContactSettings,
} from "@/lib/admin-settings/support-contact-settings";

export async function GET() {
    try {
        const settings = await getStoredSupportContactSettings();
        return NextResponse.json(settings, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            mobileNumber?: string;
            landlineNumber?: string;
        };

        const saved = await saveStoredSupportContactSettings({
            mobileNumber: body.mobileNumber ?? "",
            landlineNumber: body.landlineNumber ?? "",
        });

        return NextResponse.json(saved, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}