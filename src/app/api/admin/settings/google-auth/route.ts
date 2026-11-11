import { NextRequest, NextResponse } from "next/server";

import {
    getStoredGoogleAuthSettings,
    normalizeGoogleAuthSettings,
    saveStoredGoogleAuthSettings,
} from "@/lib/admin-settings/google-auth-settings";

/** Google sign-in switch and OAuth client. The secret never leaves the server. */
export async function GET() {
    try {
        const { clientSecret, ...rest } = await getStoredGoogleAuthSettings();
        return NextResponse.json({ ...rest, hasClientSecret: Boolean(clientSecret) });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const existing = await getStoredGoogleAuthSettings();
        const submitted = normalizeGoogleAuthSettings(body);

        // A blank secret keeps the stored one.
        await saveStoredGoogleAuthSettings({
            ...submitted,
            clientSecret: submitted.clientSecret || existing.clientSecret,
        });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
