import { NextRequest, NextResponse } from "next/server";

import {
    getStoredCaptchaSettings,
    normalizeCaptchaSettings,
    saveStoredCaptchaSettings,
} from "@/lib/admin-settings/captcha-settings";
import { revalidatePublicSite } from "@/lib/revalidate-site";

/** Form protection (Cloudflare Turnstile). The secret key never leaves the server. */
export async function GET() {
    try {
        const { secretKey, ...rest } = await getStoredCaptchaSettings();
        return NextResponse.json({ ...rest, hasSecretKey: Boolean(secretKey) });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const existing = await getStoredCaptchaSettings();
        const submitted = normalizeCaptchaSettings(body);

        // A blank secret keeps the stored one.
        await saveStoredCaptchaSettings({
            ...submitted,
            secretKey: submitted.secretKey || existing.secretKey,
        });
        // Cached pages must show (or drop) the widget now, not after the
        // 5-minute ISR window, or forms would fail the server check meanwhile.
        revalidatePublicSite();

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
