import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

type ChatbotBookingRequestBody = {
    departureCity?: string;
    destination?: string;
    travelDates?: string;
    passengers?: string;
    travelClass?: string;
    fullName?: string;
    phone?: string;
    email?: string;
};

function buildReference() {
    return `CB-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json(
            { ok: false, error: "Booking service is temporarily unavailable." },
            { status: 503 },
        );
    }

    try {
        const body = (await request.json()) as ChatbotBookingRequestBody;

        const departureCity = body.departureCity?.trim() ?? "";
        const destination = body.destination?.trim() ?? "";
        const travelDates = body.travelDates?.trim() ?? "";
        const passengers = body.passengers?.trim() ?? "";
        const travelClass = body.travelClass?.trim() ?? "";
        const fullName = body.fullName?.trim() ?? "";
        const phone = body.phone?.trim() ?? "";
        const email = body.email?.trim() ?? "";

        if (
            !departureCity ||
            !destination ||
            !travelDates ||
            !passengers ||
            !travelClass ||
            !fullName ||
            !phone ||
            !email
        ) {
            return NextResponse.json(
                { ok: false, error: "Missing required booking details." },
                { status: 400 },
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        const reference = buildReference();

        const created = await prisma.booking.create({
            data: {
                reference,
                type: "FLIGHT",
                channel: "CHATBOT",
                status: "PENDING",
                userId: user?.id ?? null,
                customerName: fullName,
                customerEmail: email,
                customerPhone: phone,
                provider: "INTERNAL",
                totalAmount: new Prisma.Decimal(0),
                currency: "PKR",
                payload: {
                    request: {
                        departureCity,
                        destination,
                        travelDates,
                        passengers,
                        travelClass,
                    },
                },
                paymentData: {
                    method: "chatbot_request",
                    status: "REQUESTED",
                    requestedAt: new Date().toISOString(),
                },
            },
            select: {
                id: true,
                reference: true,
            },
        });

        return NextResponse.json(
            { ok: true, bookingId: created.id, reference: created.reference },
            { status: 201 },
        );
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create booking request.",
            },
            { status: 500 },
        );
    }
}
