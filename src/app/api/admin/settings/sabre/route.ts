import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSabreSettings,
    missingSabreFields,
    normalizeSabreSettings,
    saveStoredSabreSettings,
    type ActiveSabreSettings,
    type SabreSettings,
    type SabreSettingsInput,
} from "@/lib/admin-settings/sabre-settings";
import { testSabreCredentials } from "@/lib/providers/sabre/flight-search";

type SabreSettingsBody = SabreSettingsInput;

/** Merges the submitted form with stored values; a blank secret keeps the stored one. */
async function resolveSubmittedSettings(body: SabreSettingsBody): Promise<SabreSettings> {
    const existing = await getStoredSabreSettings();
    const submitted = normalizeSabreSettings(body);

    return {
        ...submitted,
        clientSecret: submitted.clientSecret || existing.clientSecret,
    };
}

export async function GET() {
    try {
        const settings = await getStoredSabreSettings();
        const { clientSecret, ...rest } = settings;

        return NextResponse.json({
            ...rest,
            hasClientSecret: Boolean(clientSecret),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as SabreSettingsBody;
        await saveStoredSabreSettings(await resolveSubmittedSettings(body));
        // The root layout tells the site whether live fares are on.
        revalidatePath("/", "layout");

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
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

        const body = (await request.json()) as SabreSettingsBody;
        const settings = await resolveSubmittedSettings(body);
        const missing = missingSabreFields(settings);

        if (missing.length > 0) {
            return NextResponse.json(
                { ok: false, message: `Missing: ${missing.join(", ")}.` },
                { status: 400 },
            );
        }

        await testSabreCredentials({ ...settings, enabled: true } as ActiveSabreSettings);

        return NextResponse.json(
            { ok: true, message: "Connected. Sabre accepted these credentials." },
            { status: 200 },
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, message }, { status: 400 });
    }
}
