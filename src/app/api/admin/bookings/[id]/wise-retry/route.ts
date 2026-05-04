import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { getWiseRuntimeStatus } from "@/lib/payments/wise-config";

function asObject(value: unknown): Prisma.JsonObject {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    return value as Prisma.JsonObject;
}

function toAmountString(value: unknown): string {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return "0.00";
    }
    return parsed.toFixed(2);
}

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    if (shouldBypassDatabase()) {
        return NextResponse.json(
            { ok: false, error: "Booking service is temporarily unavailable." },
            { status: 503 },
        );
    }

    try {
        const { id } = await params;
        const wise = getWiseRuntimeStatus();
        if (!wise.checkoutUrl) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Wise checkout URL is not configured.",
                },
                { status: 503 },
            );
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            select: {
                id: true,
                reference: true,
                status: true,
                totalAmount: true,
                currency: true,
                paymentData: true,
            },
        });

        if (!booking) {
            return NextResponse.json(
                { ok: false, error: "Booking not found." },
                { status: 404 },
            );
        }

        const paymentData = asObject(booking.paymentData);
        if (String(paymentData.method ?? "").toLowerCase() !== "wise") {
            return NextResponse.json(
                { ok: false, error: "This booking is not a Wise payment booking." },
                { status: 400 },
            );
        }

        const now = new Date().toISOString();
        const previousLogRaw = paymentData.wiseReconciliationLog;
        const previousLog = Array.isArray(previousLogRaw) ? previousLogRaw : [];
        const nextLog = [
            ...previousLog,
            {
                source: "ADMIN_RETRY",
                at: now,
                bookingStatus: "PENDING",
                paymentStatus: "PENDING_CHECKOUT",
                note: "Manual retry requested from admin.",
            },
        ].slice(-50);

        const updatedPaymentData: Prisma.InputJsonObject = {
            ...paymentData,
            method: "wise",
            status: "PENDING_CHECKOUT",
            retryRequestedAt: now,
            wiseReconciliationLog: nextLog as Prisma.InputJsonValue,
        };

        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: booking.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
                paymentData: updatedPaymentData,
            },
        });

        const retryCheckoutUrl = new URL(wise.checkoutUrl);
        retryCheckoutUrl.searchParams.set("booking_reference", booking.reference);
        retryCheckoutUrl.searchParams.set(
            "amount",
            toAmountString(paymentData.grandTotal ?? booking.totalAmount),
        );
        retryCheckoutUrl.searchParams.set("currency", booking.currency);

        return NextResponse.json(
            {
                ok: true,
                bookingReference: booking.reference,
                retryCheckoutUrl: retryCheckoutUrl.toString(),
                bookingStatus: booking.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
                paymentStatus: "PENDING_CHECKOUT",
            },
            { status: 200 },
        );
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to retry Wise checkout.",
            },
            { status: 500 },
        );
    }
}
