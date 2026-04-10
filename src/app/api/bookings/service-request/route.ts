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

        const reference = buildServiceRequestReference(type);
        const created = await prisma.serviceRequest.create({
            data: {
                reference,
                type,
                status: "PENDING",
                customerName: body.customerName?.trim() || null,
                customerEmail: body.customerEmail?.trim() || null,
                customerPhone: body.customerPhone?.trim() || null,
                title: body.title?.trim() || null,
                amount:
                    toNumberOrNull(body.amount) === null
                        ? null
                        : new Prisma.Decimal(toNumberOrNull(body.amount) ?? 0),
                currency: body.currency?.trim() || null,
                payload: body.payload,
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