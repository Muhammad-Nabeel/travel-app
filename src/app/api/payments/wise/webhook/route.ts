import { BookingStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import {
    createWiseEventFingerprint,
    extractWiseBookingReference,
    extractWiseEventId,
    getWiseWebhookOutcome,
    verifyWiseWebhookSignature,
} from "@/lib/payments/wise-webhook";

function asJsonObject(value: unknown): Prisma.JsonObject {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    return value as Prisma.JsonObject;
}

function getWebhookSignature(request: NextRequest): string {
    return (
        request.headers.get("x-wise-signature") ??
        request.headers.get("x-signature") ??
        request.headers.get("signature") ??
        ""
    );
}

type WiseHistoryEvent = {
    eventKey: string;
    eventId: string | null;
    outcome: "success" | "failed" | "pending";
    receivedAt: string;
};

function readWiseHistory(paymentData: Prisma.JsonObject): WiseHistoryEvent[] {
    const raw = paymentData.wiseWebhookHistory;
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .filter(
            (item): item is WiseHistoryEvent =>
                Boolean(
                    item &&
                        typeof item === "object" &&
                        !Array.isArray(item) &&
                        typeof (item as { eventKey?: unknown }).eventKey === "string",
                ),
        )
        .map((item) => ({
            eventKey: item.eventKey,
            eventId: item.eventId ?? null,
            outcome: item.outcome,
            receivedAt: item.receivedAt,
        }));
}

function nextBookingStatus(
    current: BookingStatus,
    outcome: ReturnType<typeof getWiseWebhookOutcome>,
): BookingStatus {
    if (outcome === "success") {
        return "CONFIRMED";
    }

    if (outcome === "failed") {
        return current === "CONFIRMED" ? "CONFIRMED" : "FAILED";
    }

    return current;
}

function nextPaymentStatus(outcome: ReturnType<typeof getWiseWebhookOutcome>): string {
    if (outcome === "success") return "PAID";
    if (outcome === "failed") return "FAILED";
    return "PENDING_CHECKOUT";
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json(
            { ok: false, error: "Booking service is temporarily unavailable." },
            { status: 503 },
        );
    }

    const secret = process.env.WISE_WEBHOOK_SECRET?.trim() ?? "";
    if (!secret) {
        return NextResponse.json(
            { ok: false, error: "Wise webhook secret is not configured." },
            { status: 503 },
        );
    }

    try {
        const rawBody = await request.text();
        const signature = getWebhookSignature(request);
        const verified = verifyWiseWebhookSignature({
            rawBody,
            signatureHeader: signature,
            secret,
        });

        if (!verified) {
            return NextResponse.json(
                { ok: false, error: "Invalid Wise webhook signature." },
                { status: 401 },
            );
        }

        let payload: unknown = null;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            return NextResponse.json(
                { ok: false, error: "Invalid webhook JSON body." },
                { status: 400 },
            );
        }

        const bookingReference = extractWiseBookingReference(payload);
        if (!bookingReference) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing booking reference in webhook payload.",
                },
                { status: 400 },
            );
        }

        const booking = await prisma.booking.findUnique({
            where: { reference: bookingReference },
            select: {
                id: true,
                reference: true,
                status: true,
                paymentData: true,
            },
        });

        if (!booking) {
            return NextResponse.json(
                { ok: false, error: "Booking not found for provided reference." },
                { status: 404 },
            );
        }

        const outcome = getWiseWebhookOutcome(payload);
        const updatedBookingStatus = nextBookingStatus(booking.status, outcome);
        const paymentData = asJsonObject(booking.paymentData);
        const eventId = extractWiseEventId(payload) || null;
        const eventKey = eventId || createWiseEventFingerprint(rawBody);
        const webhookHistory = readWiseHistory(paymentData);
        const isDuplicate = webhookHistory.some(
            (event) => event.eventKey === eventKey,
        );

        if (isDuplicate) {
            return NextResponse.json(
                {
                    ok: true,
                    duplicate: true,
                    bookingReference: booking.reference,
                    bookingStatus: booking.status,
                    paymentStatus:
                        typeof paymentData.status === "string"
                            ? paymentData.status
                            : "PENDING_CHECKOUT",
                },
                { status: 200 },
            );
        }

        const now = new Date().toISOString();
        const nextHistory = [
            ...webhookHistory,
            {
                eventKey,
                eventId,
                outcome,
                receivedAt: now,
            },
        ].slice(-30);
        const previousLogRaw = paymentData.wiseReconciliationLog;
        const previousLog = Array.isArray(previousLogRaw) ? previousLogRaw : [];
        const nextLog = [
            ...previousLog,
            {
                source: "WEBHOOK",
                at: now,
                eventKey,
                eventId,
                outcome,
                bookingStatus: updatedBookingStatus,
                paymentStatus: nextPaymentStatus(outcome),
            },
        ].slice(-50);

        const updatedPaymentData: Prisma.InputJsonObject = {
            ...paymentData,
            method: "wise",
            status: nextPaymentStatus(outcome),
            wiseWebhook: {
                receivedAt: now,
                eventId,
                outcome,
                payload: payload as Prisma.InputJsonValue,
            },
            wiseWebhookHistory: nextHistory as Prisma.InputJsonValue,
            wiseReconciliationLog: nextLog as Prisma.InputJsonValue,
        };

        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: updatedBookingStatus,
                paymentData: updatedPaymentData,
            },
        });

        return NextResponse.json(
            {
                ok: true,
                bookingReference: booking.reference,
                bookingStatus: updatedBookingStatus,
                paymentStatus: nextPaymentStatus(outcome),
                outcome,
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
                        : "Failed to process Wise webhook.",
            },
            { status: 500 },
        );
    }
}
