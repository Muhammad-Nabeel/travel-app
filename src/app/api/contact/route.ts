import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { getStoredSupportContactSettings } from "@/lib/admin-settings/support-contact-settings";

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
    const parsed = contactMessageSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json(
            { ok: false, error: "Please enter your name, a valid email and a message." },
            { status: 400 },
        );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        return NextResponse.json(
            { ok: false, error: "The contact form is not available right now." },
            { status: 503 },
        );
    }

    const { name, email, message } = parsed.data;
    const contact = await getStoredSupportContactSettings();

    try {
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
            from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
            to: contact.email,
            replyTo: email,
            subject: `Website enquiry from ${name}`,
            html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
        });

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch {
        return NextResponse.json(
            { ok: false, error: "Unable to send your message." },
            { status: 502 },
        );
    }
}
