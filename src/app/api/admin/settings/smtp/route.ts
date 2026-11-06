import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSmtpSettings,
    missingSmtpFields,
    normalizeSmtpSettings,
    saveStoredSmtpSettings,
    type SmtpSettings,
} from "@/lib/admin-settings/smtp-settings";
import { testSmtpSettings } from "@/lib/email/mailer";

type SmtpSettingsBody = Partial<Record<keyof SmtpSettings, unknown>> & {
    testRecipient?: unknown;
    testSubject?: unknown;
    testBody?: unknown;
};

/** Merges the submitted form with stored values; a blank password keeps the stored one. */
async function resolveSubmittedSettings(body: SmtpSettingsBody): Promise<SmtpSettings> {
    const existing = await getStoredSmtpSettings();
    const submitted = normalizeSmtpSettings(body);

    return {
        ...submitted,
        password: submitted.password || existing.password,
    };
}

export async function GET() {
    try {
        const { password, ...rest } = await getStoredSmtpSettings();

        return NextResponse.json({
            ...rest,
            hasPassword: Boolean(password),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as SmtpSettingsBody;
        await saveStoredSmtpSettings(await resolveSubmittedSettings(body));

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

        const body = (await request.json()) as SmtpSettingsBody;
        const settings = await resolveSubmittedSettings(body);
        const missing = missingSmtpFields(settings);

        if (missing.length > 0) {
            return NextResponse.json(
                { ok: false, message: `Missing: ${missing.join(", ")}.` },
                { status: 400 },
            );
        }

        const testRecipient = typeof body.testRecipient === "string" ? body.testRecipient.trim() : "";
        const testSubject = typeof body.testSubject === "string" ? body.testSubject.trim() : "";
        const testBody = typeof body.testBody === "string" ? body.testBody.trim() : "";

        if (testRecipient && (!testSubject || !testBody)) {
            return NextResponse.json(
                { ok: false, message: "Enter a subject and message for the test email." },
                { status: 400 },
            );
        }

        await testSmtpSettings(
            settings,
            testRecipient ? { to: testRecipient, subject: testSubject, body: testBody } : undefined,
        );

        return NextResponse.json(
            {
                ok: true,
                message: testRecipient
                    ? `Connected. A test email was sent to ${testRecipient}.`
                    : "Connected. The SMTP server accepted these credentials.",
            },
            { status: 200 },
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, message }, { status: 400 });
    }
}
