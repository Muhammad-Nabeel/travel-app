import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

type ReturnLogBody = {
    bookingReference?: string;
    outcome?: "success" | "failed";
    page?: string;
};

function asObject(value: unknown): Prisma.JsonObject {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    return value as Prisma.JsonObject;
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json(
            { ok: false, error: "Booking service is temporarily unavailable." },
            { status: 503 },
        );
    }

    try {
        const body = (await request.json()) as ReturnLogBody;
        const bookingReference = body.bookingReference?.trim() ?? "";
        if (!bookingReference) {
            return NextResponse.json(
                { ok: false, error: "bookingReference is required." },
                { status: 400 },
            );
        }

        const booking = await prisma.booking.findUnique({
            where: { reference: bookingReference },
            select: { id: true, paymentData: true },
        });

        if (!booking) {
            return NextResponse.json(
                { ok: false, error: "Booking not found." },
                { status: 404 },
            );
        }

        const paymentData = asObject(booking.paymentData);
        const previousLogRaw = paymentData.wiseReconciliationLog;
        const previousLog = Array.isArray(previousLogRaw) ? previousLogRaw : [];
        const now = new Date().toISOString();
        const nextLog = [
            ...previousLog,
            {
                source: "USER_RETURN",
                at: now,
                outcome: body.outcome ?? "success",
                page: body.page ?? "unknown",
            },
        ].slice(-50);

        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                paymentData: {
                    ...paymentData,
                    wiseReconciliationLog: nextLog as Prisma.InputJsonValue,
                },
            },
        });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to log Wise return event.",
            },
            { status: 500 },
        );
    }
}
