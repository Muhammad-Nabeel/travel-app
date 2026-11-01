import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma, markDatabaseUnavailable, shouldBypassDatabase } from "@/lib/db";
import { activitySchema } from "@/lib/validations/activity";
import { getUniqueActivitySlug } from "@/lib/activity-slug";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export type ActivityRow = {
    id: string;
    slug: string | null;
    destinationId: string;
    title: string;
    category: string;
    description: string | null;
    imageUrl: string;
    cost: string;
    reviews: number;
    reviewCount: number;
    sortOrder: number;
    isActive: boolean;
    seoTitle: string;
    seoDescription: string;
};

function jsonWithSource(data: ActivityRow[], source: "db") {
    return NextResponse.json(data, {
        headers: { "x-activity-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";
    const destinationId = request.nextUrl.searchParams.get("destinationId");

    if (shouldBypassDatabase()) {
        return jsonWithSource([], "db");
    }

    try {
        const where: { isActive?: boolean; destinationId?: string } = {};
        if (!showAll) {
            where.isActive = true;
        }
        if (destinationId) {
            where.destinationId = destinationId;
        }

        const rows = await prisma.activity.findMany({
            where,
            orderBy: { sortOrder: "asc" },
        });

        if (rows.length) {
            return jsonWithSource(rows, "db");
        }
        return jsonWithSource([], "db");
    } catch (error) {
        markDatabaseUnavailable(error);
        return jsonWithSource([], "db");
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = activitySchema.parse(body);

        const activity = await prisma.activity.create({
            data: {
                slug: await getUniqueActivitySlug(
                    validatedData.title,
                    validatedData.destinationId,
                ),
                destinationId: validatedData.destinationId,
                title: validatedData.title,
                category: validatedData.category,
                description: validatedData.description,
                imageUrl: validatedData.imageUrl,
                cost: validatedData.cost,
                reviews: validatedData.reviews,
                reviewCount: validatedData.reviewCount,
                sortOrder: validatedData.sortOrder,
                isActive: validatedData.isActive,
                seoTitle: validatedData.seoTitle,
                seoDescription: validatedData.seoDescription,
            },
        });
        revalidatePublicSite();
        return NextResponse.json(activity, { status: 201 });
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
            { ok: false, error: "Database error" },
            { status: 503 },
        );
    }
}
