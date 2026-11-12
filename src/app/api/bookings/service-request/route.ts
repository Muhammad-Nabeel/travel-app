import { Prisma } from "@prisma/client";
import { after, NextRequest, NextResponse } from "next/server";

import { resolveBookingUserId } from "@/lib/bookings/link-user";
import { priceServiceRequest } from "@/lib/bookings/service-request-pricing";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { rejectWithoutCaptcha } from "@/lib/captcha/verify-captcha";
import { sendBookingRequestEmails } from "@/lib/email/booking-emails";
import {
    buildServiceRequestReference,
    formatServiceRequestType,
    isServiceRequestType,
    type ServiceRequestInput,
} from "@/lib/service-requests";

function toInputJsonObject(value: unknown): Prisma.InputJsonObject | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    try {
        return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json(
            {
                ok: false,
                error: "Request service is temporarily unavailable.",
            },
            { status: 503 },
        );
    }

    try {
        const body = (await request.json()) as ServiceRequestInput;

        const captchaRejection = await rejectWithoutCaptcha(request, body.captchaToken);
        if (captchaRejection) return captchaRejection;
        const type = typeof body.type === "string" ? body.type.toUpperCase() : "";

        if (!isServiceRequestType(type)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Invalid request type.",
                },
                { status: 400 },
            );
        }

        if (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Request payload is required.",
                },
                { status: 400 },
            );
        }

        const parsedPayload = toInputJsonObject(body.payload);
        if (!parsedPayload) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Request payload contains unsupported values.",
                },
                { status: 400 },
            );
        }

        // The estimate comes from the package in the database, not body.amount.
        const price = await priceServiceRequest(type, parsedPayload as Record<string, unknown>);
        if (!price.ok) {
            return NextResponse.json({ ok: false, error: price.error }, { status: 400 });
        }
        const payload: Prisma.InputJsonObject =
            price.amount !== null && "estimatedTotal" in parsedPayload
                ? { ...parsedPayload, estimatedTotal: price.amount }
                : parsedPayload;

        const customerName = body.customerName?.trim() || null;
        const customerEmail = body.customerEmail?.trim().toLowerCase() || null;
        const customerPhone = body.customerPhone?.trim() || null;
        const title = body.title?.trim() || null;
        const reference = buildServiceRequestReference(type);
        const userId = await resolveBookingUserId();
        const created = await prisma.booking.create({
            data: {
                reference,
                type,
                channel: "SERVICE_REQUEST",
                status: "OPEN",
                userId,
                customerName,
                customerEmail,
                customerPhone,
                title,
                totalAmount: price.amount === null ? null : new Prisma.Decimal(price.amount),
                currency: price.currency ?? (body.currency?.trim() || undefined),
                payload,
            },
            select: {
                id: true,
                reference: true,
            },
        });

        after(() =>
            sendBookingRequestEmails({
                bookingId: created.id,
                isGuest: userId === null,
                reference: created.reference,
                kind: `${formatServiceRequestType(type)} enquiry`,
                customerName,
                customerEmail,
                customerPhone,
                summary: title ? [["Request", title]] : [],
                total:
                    price.amount !== null && price.currency
                        ? { amount: price.amount, currency: price.currency }
                        : null,
            }),
        );

        return NextResponse.json(
            {
                ok: true,
                requestId: created.id,
                reference: created.reference,
            },
            { status: 201 },
        );
    } catch (error) {
        markDatabaseUnavailable(error);
        // Internal errors (e.g. Prisma messages with file paths) stay in the server log.
        console.error("[service-request] Failed to create booking:", error);

        return NextResponse.json(
            {
                ok: false,
                error: "We couldn't submit your request right now. Please try again or contact us.",
            },
            { status: 500 },
        );
    }
}