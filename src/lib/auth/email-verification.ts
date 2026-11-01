import { randomBytes, createHash } from "node:crypto";
import { Resend } from "resend";

import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import { prisma } from "@/lib/db";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function getBaseUrl() {
    return (
        process.env.NEXTAUTH_URL ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.SITE_URL ??
        "http://localhost:3004"
    );
}

export async function createEmailVerificationToken(userId: string) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.emailVerificationToken.deleteMany({ where: { userId } });

    await prisma.emailVerificationToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
    });

    return rawToken;
}

export async function sendVerificationEmail(to: string, token: string) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
    const verifyUrl = `${getBaseUrl()}/api/auth/verify-email?token=${token}`;
    const resend = new Resend(resendKey);
    const { name: brandName } = await getStoredBrandSettings();

    await resend.emails.send({
        from,
        to,
        subject: "Verify your email address",
        html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
        <h2 style="margin:0 0 12px;">Confirm your ${brandName} account</h2>
        <p style="margin:0 0 16px;">Thanks for signing up. Please verify your email to activate login with email and password.</p>
        <p style="margin:0 0 20px;">
          <a href="${verifyUrl}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600;">
            Verify email
          </a>
        </p>
        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">If the button does not work, copy this link:</p>
        <p style="margin:0;color:#2563eb;font-size:14px;word-break:break-word;">${verifyUrl}</p>
        <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">This link expires in 24 hours.</p>
      </div>
    `,
    });
}

export function hashEmailVerificationToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}
