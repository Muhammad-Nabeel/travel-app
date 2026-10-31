import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/db";
import { activitySchema } from "@/lib/validations/activity";
import { getUniqueActivitySlug } from "@/lib/activity-slug";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const validatedData = activitySchema.parse(body);

        const activity = await prisma.activity.update({
            where: { id },
            data: {
                slug: await getUniqueActivitySlug(
                    validatedData.title,
                    validatedData.destinationId,
                    id,
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
        return NextResponse.json(activity, { status: 200 });
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
        await prisma.activity.delete({ where: { id } });
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
