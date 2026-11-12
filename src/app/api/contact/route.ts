import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getStoredSupportContactSettings } from "@/lib/admin-settings/support-contact-settings";
import { rejectWithoutCaptcha } from "@/lib/captcha/verify-captcha";
import { sendMail } from "@/lib/email/mailer";

const contactMessageSchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(150),
    message: z.string().trim().min(1).max(5000),
});

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Sends a Contact Us message to the support email set in Admin → Settings → Contact Details.
export async function POST(request: NextRequest) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    const captchaRejection = await rejectWithoutCaptcha(request, body?.captchaToken);
    if (captchaRejection) return captchaRejection;

    const parsed = contactMessageSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { ok: false, error: "Please enter your name, a valid email and a message." },
            { status: 400 },
        );
    }

    const { name, email, message } = parsed.data;
    const contact = await getStoredSupportContactSettings();

    try {
        await sendMail({
            to: contact.email,
            replyTo: email,
            subject: `Website enquiry from ${name}`,
            html: `
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="font-family:Montserrat,Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;">
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
        });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error("[contact] SMTP send failed:", error);
        return NextResponse.json(
            { ok: false, error: "Unable to send your message." },
            { status: 502 },
        );
    }
}
