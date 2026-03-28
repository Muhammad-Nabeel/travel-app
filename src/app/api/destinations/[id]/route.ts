import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { destinationSchema } from "@/lib/validations/destination";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const validatedData = destinationSchema.parse(body);

        const destination = await prisma.destination.update({
            where: { id },
            data: {
                city: validatedData.city,
                country: validatedData.country,
                fare: validatedData.fare,
                iataCode: validatedData.iataCode,
                notes: validatedData.notes,
                gradient: validatedData.gradient,
                sortOrder: validatedData.sortOrder,
                isActive: validatedData.isActive,
            },
        });
        return NextResponse.json(destination, { status: 200 });
    } catch (err: any) {
        if (err?.issues && Array.isArray(err.issues)) {
            const message = err.issues
                .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
                .join("; ");
            return NextResponse.json(
                { ok: false, error: `Validation: ${message}` },
                { status: 400 },
            );
        }
        if (err instanceof Error) {
            return NextResponse.json(
                { ok: false, error: err.message },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { ok: false, error: "Update failed" },
            { status: 503 },
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        await prisma.destination.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json(
                { ok: false, error: err.message },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { ok: false, error: "Delete failed" },
            { status: 503 },
        );
    }
}
