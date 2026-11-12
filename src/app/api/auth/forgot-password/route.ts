import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rejectWithoutCaptcha } from "@/lib/captcha/verify-captcha";

import {
    createPasswordResetToken,
    sendPasswordResetEmail,
} from "@/lib/auth/password-reset";
import { prisma } from "@/lib/db";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

// Same reply whether or not the account exists, so the form can't be used to discover emails.
const GENERIC_RESPONSE = {
    success: true,
    message: "If an account exists for that email, a password reset link is on its way.",
};

export async function POST(req: NextRequest) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const captchaRejection = await rejectWithoutCaptcha(
        req,
        (body as { captchaToken?: unknown } | null)?.captchaToken,
    );
    if (captchaRejection) return captchaRejection;

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid input";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase().trim() },
        select: { id: true, email: true },
    });

    if (user) {
        try {
            const token = await createPasswordResetToken(user.id);
            if (token) await sendPasswordResetEmail(user.email, token);
        } catch (error) {
            console.error("[forgot-password] Reset email failed:", error);
        }
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
}
