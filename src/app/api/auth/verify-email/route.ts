import { NextRequest, NextResponse } from "next/server";

import {
    hashEmailVerificationToken,
} from "@/lib/auth/email-verification";
import { prisma } from "@/lib/db";

function getSiteBaseUrl(req: NextRequest) {
    return (
        process.env.NEXTAUTH_URL ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        `${req.nextUrl.protocol}//${req.nextUrl.host}`
    );
}

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    const baseUrl = getSiteBaseUrl(req);

    if (!token) {
        return NextResponse.redirect(
            new URL("/signin?verification=invalid", baseUrl)
        );
    }

    const tokenHash = hashEmailVerificationToken(token);

    const verification = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
        select: {
            id: true,
            userId: true,
            expiresAt: true,
        },
    });

    if (!verification || verification.expiresAt < new Date()) {
        if (verification) {
            await prisma.emailVerificationToken.delete({
                where: { id: verification.id },
            });
        }

        return NextResponse.redirect(
            new URL("/signin?verification=expired", baseUrl)
        );
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: verification.userId },
            data: { emailVerifiedAt: new Date() },
        }),
        prisma.emailVerificationToken.delete({
            where: { id: verification.id },
        }),
    ]);

    return NextResponse.redirect(new URL("/signin?verification=success", baseUrl));
}
