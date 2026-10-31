import { NextRequest, NextResponse } from "next/server";
import { prisma, shouldBypassDatabase } from "@/lib/db";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    if (shouldBypassDatabase()) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    try {
        const review = await prisma.customerReview.findUnique({ where: { id } });
        if (!review) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json(review);
    } catch (err) {
        console.error("[reviews/[id] GET]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    if (shouldBypassDatabase()) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    try {
        const body = (await request.json()) as Record<string, unknown>;
        const rating = body.rating !== undefined
            ? Math.min(5, Math.max(1, Number(body.rating) || 5))
            : undefined;

        const review = await prisma.customerReview.update({
            where: { id },
            data: {
                ...(body.customerName !== undefined && {
                    customerName: String(body.customerName).trim(),
                }),
                ...(body.location !== undefined && {
                    location: body.location ? String(body.location).trim() : null,
                }),
                ...(rating !== undefined && { rating }),
                ...(body.title !== undefined && {
                    title: String(body.title).trim(),
                }),
                ...(body.body !== undefined && {
                    body: String(body.body).trim(),
                }),
                ...(body.tripType !== undefined && {
                    tripType: body.tripType ? String(body.tripType).trim() : null,
                }),
                ...(body.isVerified !== undefined && {
                    isVerified: Boolean(body.isVerified),
                }),
                ...(body.isPublished !== undefined && {
                    isPublished: Boolean(body.isPublished),
                }),
                ...(body.sortOrder !== undefined && {
                    sortOrder: Number(body.sortOrder) || 0,
                }),
            },
        });

        revalidatePublicSite();
        return NextResponse.json(review);
    } catch (err) {
        console.error("[reviews/[id] PUT]", err);
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    if (shouldBypassDatabase()) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    try {
        await prisma.customerReview.delete({ where: { id } });
        revalidatePublicSite();
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[reviews/[id] DELETE]", err);
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }
}
