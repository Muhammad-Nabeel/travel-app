import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createEmailVerificationToken, sendVerificationEmail } from "@/lib/auth/email-verification";
import { rejectWithoutCaptcha } from "@/lib/captcha/verify-captcha";
import { prisma } from "@/lib/db";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Invalid email address") });

/** One email per account per minute, so the button can't flood an inbox. */
const RESEND_COOLDOWN_MS = 60 * 1000;

// Same reply whatever the account state, so the form can't be used to discover emails.
const GENERIC_RESPONSE = {
    success: true,
    message: "If that email has an account waiting for verification, a new link is on its way.",
};

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

    const captchaRejection = await rejectWithoutCaptcha(req, body?.captchaToken);
    if (captchaRejection) return captchaRejection;

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                emailVerifiedAt: true,
                emailVerificationTokens: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { createdAt: true },
                },
            },
        });

        const lastSentAt = user?.emailVerificationTokens[0]?.createdAt.getTime() ?? 0;
        if (
            user &&
            user.passwordHash &&
            !user.emailVerifiedAt &&
            Date.now() - lastSentAt > RESEND_COOLDOWN_MS
        ) {
            const token = await createEmailVerificationToken(user.id);
            await sendVerificationEmail(user.email, token);
        }
    } catch (error) {
        console.error("[resend-verification] Failed:", error);
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
}
