import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { rejectWithoutCaptcha } from "@/lib/captcha/verify-captcha";
import { sendAccountExistsEmail } from "@/lib/auth/account-exists-email";
import { prisma } from "@/lib/db";
import {
    createEmailVerificationToken,
    sendVerificationEmail,
} from "@/lib/auth/email-verification";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

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

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid input";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Same reply whether or not the email is registered, so the form can't be
    // used to discover accounts. The owner of an existing account is emailed.
    const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true, passwordHash: true, emailVerifiedAt: true },
    });

    if (existing) {
        await notifyExistingAccount(existing);
        return SUCCESS_RESPONSE();
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user: { id: string; email: string };
    try {
        user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
                role: "CUSTOMER",
            },
            select: {
                id: true,
                email: true,
            },
        });
    } catch (error) {
        // Two sign-ups for the same email at once: the second one lands here.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return SUCCESS_RESPONSE();
        }
        console.error("[register] Failed to create account:", error);
        return NextResponse.json(
            { error: "We couldn't create your account right now. Please try again." },
            { status: 500 },
        );
    }

    try {
        const verificationToken = await createEmailVerificationToken(user.id);
        await sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
        // The account exists; the customer can use "Resend verification email".
        console.error("[register] Verification email failed:", error);
    }

    return SUCCESS_RESPONSE();
}

const SUCCESS_RESPONSE = () =>
    NextResponse.json(
        {
            success: true,
            message: "Check your email to verify your account before signing in.",
        },
        { status: 201 },
    );

async function notifyExistingAccount(user: {
    id: string;
    email: string;
    passwordHash: string | null;
    emailVerifiedAt: Date | null;
}) {
    try {
        if (user.passwordHash && !user.emailVerifiedAt) {
            // Signed up before but never verified: send a fresh link. The
            // stored password is kept, so this can't be used to take it over.
            const token = await createEmailVerificationToken(user.id);
            await sendVerificationEmail(user.email, token);
        } else {
            await sendAccountExistsEmail(user.email, { hasPassword: Boolean(user.passwordHash) });
        }
    } catch (error) {
        console.error("[register] Existing-account email failed:", error);
    }
}
