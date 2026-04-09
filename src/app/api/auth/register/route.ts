import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
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

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid input";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
    });

    if (existing) {
        return NextResponse.json(
            { error: "An account with this email already exists" },
            { status: 409 }
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
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

    try {
        const verificationToken = await createEmailVerificationToken(user.id);
        await sendVerificationEmail(user.email, verificationToken);
    } catch {
        return NextResponse.json(
            {
                error:
                    "Account created, but verification email could not be sent. Please contact support.",
            },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            success: true,
            message: "Registration successful. Please verify your email before signing in.",
        },
        { status: 201 }
    );
}
