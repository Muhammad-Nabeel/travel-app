import { randomBytes, createHash } from "node:crypto";

import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
// Stops the form being used to flood someone's inbox.
const RESEND_COOLDOWN_MS = 60 * 1000;

function getBaseUrl() {
    return (
        process.env.NEXTAUTH_URL ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.SITE_URL ??
        "http://localhost:3004"
    );
}

export function hashPasswordResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

/** Returns null when a reset email was already sent within the cooldown. */
export async function createPasswordResetToken(userId: string) {
    const recent = await prisma.passwordResetToken.findFirst({
        where: { userId, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
        select: { id: true },
    });
    if (recent) return null;

    const rawToken = randomBytes(32).toString("hex");

    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.create({
        data: {
            userId,
            tokenHash: hashPasswordResetToken(rawToken),
            expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
    });

    return rawToken;
}

export async function sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
    const { name: brandName } = await getStoredBrandSettings();

    await sendMail({
        to,
        subject: `Reset your ${brandName} password`,
        html: `
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="font-family:Montserrat,Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
        <h2 style="margin:0 0 12px;">Reset your ${brandName} password</h2>
        <p style="margin:0 0 16px;">We received a request to reset the password for your account. Click the button below to choose a new one.</p>
        <p style="margin:0 0 20px;">
          <a href="${resetUrl}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600;">
            Reset password
          </a>
        </p>
        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">If the button does not work, copy this link:</p>
        <p style="margin:0;color:#2563eb;font-size:14px;word-break:break-word;">${resetUrl}</p>
        <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">This link expires in 1 hour. If you did not ask to reset your password, you can ignore this email.</p>
      </div>
    `,
    });
}
