import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSupportContactSettings,
    saveStoredSupportContactSettings,
    type SupportContactSettings,
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
        const body = (await request.json()) as Partial<SupportContactSettings>;

        const saved = await saveStoredSupportContactSettings({
            email: body.email ?? "",
            mobileNumber: body.mobileNumber ?? "",
            landlineNumber: body.landlineNumber ?? "",
            whatsappNumber: body.whatsappNumber ?? "",
            address: body.address ?? "",
        });

        return NextResponse.json(saved, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}