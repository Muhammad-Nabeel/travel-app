import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/db";
import { destinationSchema } from "@/lib/validations/destination";
import { revalidatePublicSite } from "@/lib/revalidate-site";

function toSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}

async function getUniqueDestinationSlug(city: string, destinationId: string) {
    const baseSlug = toSlug(city) || "destination";

    for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
        const existing = await prisma.destination.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existing || existing.id === destinationId) {
            return candidate;
        }
    }

    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
}

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const destination = await prisma.destination.findUnique({ where: { id } });

        if (!destination) {
            return NextResponse.json(
                { ok: false, error: "Destination not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(destination);
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json(
                { ok: false, error: err.message },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { ok: false, error: "Fetch failed" },
            { status: 503 },
        );
    }
}

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
                slug: await getUniqueDestinationSlug(validatedData.city, id),
                city: validatedData.city,
                country: validatedData.country,
                scope: validatedData.scope,
                tagline: validatedData.tagline,
                overview: validatedData.overview,
                highlights: validatedData.highlights,
                travelTips: validatedData.travelTips,
                bestTimeToVisit: validatedData.bestTimeToVisit,
                idealStay: validatedData.idealStay,
                currency: validatedData.currency,
                timezone: validatedData.timezone,
                language: validatedData.language,
                fare: validatedData.fare,
                iataCode: validatedData.iataCode,
                imageUrl: validatedData.imageUrl,
                notes: validatedData.notes,
                gradient: validatedData.gradient,
                sortOrder: validatedData.sortOrder,
                isActive: validatedData.isActive,
                seoTitle: validatedData.seoTitle,
                seoDescription: validatedData.seoDescription,
            },
        });
        revalidatePublicSite();
        return NextResponse.json(destination, { status: 200 });
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const message = err.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
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
        revalidatePublicSite();
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
