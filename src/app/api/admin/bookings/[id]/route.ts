import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { isBookingStatus } from "@/lib/bookings/status";
import { prisma, shouldBypassDatabase } from "@/lib/db";
import { authOptions } from "@/lib/providers/auth/auth-provider";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_NOTE_LENGTH = 1000;

/**
 * Admin-only (enforced in proxy.ts): move a booking through Open / Processing /
 * Success / Lost. Every change is recorded in BookingEvent with the admin who
 * made it, so "who cancelled this?" always has an answer.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
        | { status?: unknown; note?: unknown }
        | null;

    if (!isBookingStatus(body?.status)) {
        return NextResponse.json({ ok: false, error: "Invalid booking status." }, { status: 400 });
    }
    const nextStatus = body.status;
    const note =
        typeof body.note === "string" && body.note.trim()
            ? body.note.trim().slice(0, MAX_NOTE_LENGTH)
            : null;

    const session = await getServerSession(authOptions);
    const actor = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;
    const actorId = actor?.id ?? null;
    const actorName = actor?.name || actor?.email || "Admin";

    try {
        const updated = await prisma.$transaction(async (tx) => {
            const current = await tx.booking.findUnique({
                where: { id },
                select: { status: true },
            });
            if (!current) return null;

            if (current.status === nextStatus && !note) {
                return { id, status: current.status };
            }

            const booking = await tx.booking.update({
                where: { id },
                data: { status: nextStatus },
                select: { id: true, status: true },
            });
            await tx.bookingEvent.create({
                data: {
                    bookingId: id,
                    fromStatus: current.status,
                    toStatus: nextStatus,
                    note,
                    actorId,
                    actorName,
                },
            });
            return booking;
        });

        if (!updated) {
            return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
        }
        return NextResponse.json({ ok: true, booking: updated }, { status: 200 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
        }
        console.error("[admin-bookings] Status update failed:", error);
        return NextResponse.json({ ok: false, error: "Failed to update booking status." }, { status: 500 });
    }
}
