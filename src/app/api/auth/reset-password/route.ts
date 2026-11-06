import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { hashPasswordResetToken } from "@/lib/auth/password-reset";
import { prisma } from "@/lib/db";

const resetPasswordSchema = z.object({
    token: z.string().min(1, "Reset link is invalid"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const INVALID_LINK = "This reset link is invalid or has expired. Please request a new one.";

export async function POST(req: NextRequest) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid input";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    const reset = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashPasswordResetToken(parsed.data.token) },
        select: { id: true, userId: true, expiresAt: true },
    });

    if (!reset || reset.expiresAt < new Date()) {
        if (reset) {
            await prisma.passwordResetToken.delete({ where: { id: reset.id } });
        }
        return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.findUniqueOrThrow({
        where: { id: reset.userId },
        select: { emailVerifiedAt: true },
    });

    await prisma.$transaction([
        prisma.user.update({
            where: { id: reset.userId },
            // Opening the emailed link proves ownership of the address.
            data: { passwordHash, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
        }),
        prisma.passwordResetToken.deleteMany({ where: { userId: reset.userId } }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
}
