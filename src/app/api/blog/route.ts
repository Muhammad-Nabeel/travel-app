import { NextRequest, NextResponse } from "next/server";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { blogPostSchema } from "@/lib/validations/blog";

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

export const DUMMY_BLOG_POSTS: BlogPostRow[] = [
    {
        id: "bp01",
        slug: "top-tips-for-umrah-first-timers",
        title: "Top Tips for Umrah First-Timers",
        excerpt:
            "Everything you need to know before your first Umrah journey — from packing essentials to navigating the Haram.",
        content: "<p>Full article content goes here...</p>",
        coverImageUrl:
            "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&auto=format&fit=crop",
        author: "AIM Digital",
        category: "umrah",
        tags: ["umrah", "tips", "first-time"],
        status: "PUBLISHED",
        publishedAt: new Date("2026-02-10"),
        sortOrder: 1,
        createdAt: new Date("2026-02-10"),
        updatedAt: new Date("2026-02-10"),
    },
    {
        id: "bp02",
        slug: "best-time-to-visit-dubai",
        title: "Best Time to Visit Dubai in 2026",
        excerpt:
            "Dubai shines year-round, but these months offer the best weather, prices, and events for Pakistani and UK travellers.",
        content: "<p>Full article content goes here...</p>",
        coverImageUrl:
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop",
        author: "AIM Digital",
        category: "destinations",
        tags: ["dubai", "uae", "travel-guide"],
        status: "PUBLISHED",
        publishedAt: new Date("2026-02-18"),
        sortOrder: 2,
        createdAt: new Date("2026-02-18"),
        updatedAt: new Date("2026-02-18"),
    },
    {
        id: "bp03",
        slug: "how-to-find-cheap-flights-from-pakistan",
        title: "How to Find Cheap Flights from Pakistan",
        excerpt:
            "Insider strategies for booking the cheapest international fares from Karachi, Lahore, and Islamabad.",
        content: "<p>Full article content goes here...</p>",
        coverImageUrl:
            "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop",
        author: "AIM Digital",
        category: "flights",
        tags: ["flights", "budget", "pakistan"],
        status: "PUBLISHED",
        publishedAt: new Date("2026-03-01"),
        sortOrder: 3,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
    },
    {
        id: "bp04",
        slug: "istanbul-travel-guide-2026",
        title: "Istanbul Travel Guide 2026",
        excerpt:
            "From the Grand Bazaar to Sultanahmet, how to make the most of a 5-day Istanbul trip on any budget.",
        content: "<p>Full article content goes here...</p>",
        coverImageUrl:
            "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&auto=format&fit=crop",
        author: "AIM Digital",
        category: "destinations",
        tags: ["istanbul", "turkey", "city-guide"],
        status: "PUBLISHED",
        publishedAt: new Date("2026-03-12"),
        sortOrder: 4,
        createdAt: new Date("2026-03-12"),
        updatedAt: new Date("2026-03-12"),
    },
];

function jsonWithSource(data: BlogPostRow[], source: "db" | "dummy") {
    return NextResponse.json(data, {
        headers: { "x-blog-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    if (shouldBypassDatabase()) {
        const filtered = showAll
            ? DUMMY_BLOG_POSTS
            : DUMMY_BLOG_POSTS.filter((p) => p.status === "PUBLISHED");
        return jsonWithSource(filtered, "dummy");
    }

    try {
        const rows = await prisma.blogPost.findMany({
            where: showAll ? undefined : { status: "PUBLISHED" },
            orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
        });

        if (rows.length) {
            return jsonWithSource(rows as BlogPostRow[], "db");
        }

        if (showAll) {
            return jsonWithSource([], "db");
        }

        return jsonWithSource(
            DUMMY_BLOG_POSTS.filter((p) => p.status === "PUBLISHED"),
            "dummy",
        );
    } catch (error) {
        markDatabaseUnavailable(error);
        const filtered = showAll
            ? DUMMY_BLOG_POSTS
            : DUMMY_BLOG_POSTS.filter((p) => p.status === "PUBLISHED");
        return jsonWithSource(filtered, "dummy");
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

        return NextResponse.json(post, { status: 201 });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
