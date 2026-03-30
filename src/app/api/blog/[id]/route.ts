import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { blogPostSchema } from "@/lib/validations/blog";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;

    try {
        const post = await prisma.blogPost.findUnique({ where: { id } });
        if (!post) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json(post);
    } catch {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: Params) {
    const { id } = await params;

    try {
        const body = await request.json();
        const validated = blogPostSchema.partial().parse(body);

        const existing = await prisma.blogPost.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const wasPublished = existing.status !== "PUBLISHED";
        const isNowPublished = validated.status === "PUBLISHED";

        const post = await prisma.blogPost.update({
            where: { id },
            data: {
                ...validated,
                publishedAt:
                    validated.publishedAt !== undefined
                        ? validated.publishedAt
                            ? new Date(validated.publishedAt)
                            : null
                        : wasPublished && isNowPublished
                            ? new Date()
                            : existing.publishedAt,
            },
        });

        return NextResponse.json(post);
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params;

    try {
        await prisma.blogPost.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Not found or delete failed" }, { status: 404 });
    }
}
