import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { authOptions } from "@/lib/providers/auth/auth-provider";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export type CustomerReviewRow = {
    id: string;
    customerName: string;
    location: string | null;
    rating: number;
    title: string;
    body: string;
    tripType: string | null;
    isVerified: boolean;
    isPublished: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get("all") === "true";
    const publishedOnly = !fetchAll;

    if (shouldBypassDatabase()) {
        return NextResponse.json([]);
    }

    try {
        const rows = await prisma.customerReview.findMany({
            where: publishedOnly ? { isPublished: true } : undefined,
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        });
        return NextResponse.json(rows);
    } catch (err) {
        markDatabaseUnavailable(err);
        console.error("[reviews GET]", err);
        return NextResponse.json([]);
    }
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json(
            { error: "Database unavailable" },
            { status: 503 },
        );
    }

    try {
        const body = (await request.json()) as Partial<CustomerReviewRow>;

        if (!body.customerName?.trim()) {
            return NextResponse.json(
                { error: "Customer name is required" },
                { status: 400 },
            );
        }
        if (!body.title?.trim()) {
            return NextResponse.json(
                { error: "Review title is required" },
                { status: 400 },
            );
        }
        if (!body.body?.trim()) {
            return NextResponse.json(
                { error: "Review body is required" },
                { status: 400 },
            );
        }

        const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
        // Visitor reviews stay hidden until an admin publishes them.
        const session = await getServerSession(authOptions);
        const isAdmin =
            (session?.user as { role?: string } | undefined)?.role === "ADMIN";

        const review = await prisma.customerReview.create({
            data: {
                customerName: body.customerName.trim(),
                location: body.location?.trim() || null,
                rating,
                title: body.title.trim(),
                body: body.body.trim(),
                tripType: body.tripType?.trim() || null,
                isVerified: isAdmin ? (body.isVerified ?? false) : false,
                isPublished: isAdmin ? (body.isPublished ?? false) : false,
                sortOrder: isAdmin ? Number(body.sortOrder) || 0 : 0,
            },
        });

        revalidatePublicSite();
        return NextResponse.json(review, { status: 201 });
    } catch (err) {
        console.error("[reviews POST]", err);
        return NextResponse.json(
            { error: "Failed to create review" },
            { status: 500 },
        );
    }
}
