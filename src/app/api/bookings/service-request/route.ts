import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import {
    buildServiceRequestReference,
    isServiceRequestType,
    type ServiceRequestInput,
} from "@/lib/service-requests";

function toNumberOrNull(value: unknown) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

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

        const payload = toInputJsonObject(body.payload);
        if (!payload) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Request payload contains unsupported values.",
                },
                { status: 400 },
            );
        }

        const parsedAmount = toNumberOrNull(body.amount);
        const reference = buildServiceRequestReference(type);
        const created = await prisma.booking.create({
            data: {
                reference,
                type,
                channel: "SERVICE_REQUEST",
                status: "PENDING",
                customerName: body.customerName?.trim() || null,
                customerEmail: body.customerEmail?.trim() || null,
                customerPhone: body.customerPhone?.trim() || null,
                title: body.title?.trim() || null,
                totalAmount: parsedAmount === null ? null : new Prisma.Decimal(parsedAmount),
                currency: body.currency?.trim() || undefined,
                payload,
            },
            select: {
                id: true,
                reference: true,
            },
        });

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

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create service request.",
            },
            { status: 500 },
        );
    }
}