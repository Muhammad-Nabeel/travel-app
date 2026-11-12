import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma, markDatabaseUnavailable } from "@/lib/db";
import { blogPostSchema } from "@/lib/validations/blog";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { sanitizeBlogHtml } from "@/lib/sanitize-blog-html";

// The segment is a slug for public reads and the post id for admin writes.
type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const { slug } = await params;
    // Drafts only with ?all=true, which the proxy limits to admins.
    const includeDrafts = request.nextUrl.searchParams.get("all") === "true";

    try {
        const post = await prisma.blogPost.findUnique({ where: { slug } });
        if (!post || (!includeDrafts && post.status !== "PUBLISHED")) {
            return NextResponse.json(
                { error: "Blog post not found" },
                { status: 404 },
            );
        }
        return NextResponse.json(post);
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json(
            { error: "Blog is temporarily unavailable" },
            { status: 503 },
        );
    }
}

export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { slug: id } = await params;
        const body = await request.json();

        // Partial updates (e.g. the status toggle) only touch the fields sent;
        // zod would otherwise fill omitted fields with their defaults.
        const parsed = blogPostSchema.partial().parse(body);
        const data = Object.fromEntries(
            Object.entries(parsed).filter(([key]) => key in body),
        ) as Partial<typeof parsed>;

        const existing = await prisma.blogPost.findUnique({
            where: { id },
            select: { publishedAt: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Blog post not found" },
                { status: 404 },
            );
        }

        const post = await prisma.blogPost.update({
            where: { id },
            data: {
                ...data,
                ...(data.content !== undefined
                    ? { content: sanitizeBlogHtml(data.content) }
                    : {}),
                publishedAt:
                    data.publishedAt !== undefined
                        ? data.publishedAt
                            ? new Date(data.publishedAt)
                            : null
                        : data.status === "PUBLISHED" && !existing.publishedAt
                            ? new Date()
                            : undefined,
            },
        });

        revalidatePublicSite();
        return NextResponse.json(post);
    } catch (err) {
        if (err instanceof ZodError) {
            return NextResponse.json(
                { error: err.issues[0]?.message ?? "Validation error" },
                { status: 400 },
            );
        }
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Update failed" },
            { status: 503 },
        );
    }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
    try {
        const { slug: id } = await params;
        await prisma.blogPost.delete({ where: { id } });
        revalidatePublicSite();
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Delete failed" },
            { status: 503 },
        );
    }
}
