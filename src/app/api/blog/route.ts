import { NextRequest, NextResponse } from "next/server";
import { prisma, markDatabaseUnavailable } from "@/lib/db";
import { blogPostSchema } from "@/lib/validations/blog";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export type BlogPostRow = {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    author: string;
    category: string;
    tags: unknown;
    status: string;
    publishedAt: Date | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
};

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    try {
        const rows = await prisma.blogPost.findMany({
            where: showAll ? undefined : { status: "PUBLISHED" },
            orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
        });
        return NextResponse.json(rows as BlogPostRow[]);
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json(
            { error: "Blog is temporarily unavailable" },
            { status: 503 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = blogPostSchema.parse(body);

        const post = await prisma.blogPost.create({
            data: {
                ...validated,
                tags: validated.tags ?? [],
                publishedAt: validated.publishedAt
                    ? new Date(validated.publishedAt)
                    : validated.status === "PUBLISHED"
                        ? new Date()
                        : null,
            },
        });

        revalidatePublicSite();
        return NextResponse.json(post, { status: 201 });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
