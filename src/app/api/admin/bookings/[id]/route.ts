import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isBookingStatus } from "@/lib/bookings/status";
import { prisma, shouldBypassDatabase } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

/** Admin-only (enforced in proxy.ts): move a booking through Open / Processing / Success / Lost. */
export async function PATCH(request: NextRequest, context: RouteContext) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;

    if (!isBookingStatus(body?.status)) {
        return NextResponse.json({ ok: false, error: "Invalid booking status." }, { status: 400 });
    }

    try {
        const updated = await prisma.booking.update({
            where: { id },
            data: { status: body.status },
            select: { id: true, status: true },
        });
        return NextResponse.json({ ok: true, booking: updated }, { status: 200 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
        }
        return NextResponse.json({ ok: false, error: "Failed to update booking status." }, { status: 500 });
    }
}
