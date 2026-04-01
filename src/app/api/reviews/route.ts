import { NextRequest, NextResponse } from "next/server";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

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

const DUMMY_REVIEWS: CustomerReviewRow[] = [
    {
        id: "rv01",
        customerName: "Ahmed Al-Rashdi",
        location: "Karachi, Pakistan",
        rating: 5,
        title: "Outstanding Umrah experience — exceeded every expectation",
        body: "The team handled every detail flawlessly. From visa arrangements to hotel bookings close to the Haram, everything was perfect. I will definitely use this service again for my next trip.",
        tripType: "Umrah",
        isVerified: true,
        isPublished: true,
        sortOrder: 1,
        createdAt: new Date("2026-03-10"),
        updatedAt: new Date("2026-03-10"),
    },
    {
        id: "rv02",
        customerName: "Fatima Malik",
        location: "Lahore, Pakistan",
        rating: 5,
        title: "Seamless family holiday — highly professional service",
        body: "Travelling with three young children always felt daunting but the team made it stress-free. Our Dubai itinerary was perfectly planned and the airport assistance was invaluable.",
        tripType: "Family",
        isVerified: true,
        isPublished: true,
        sortOrder: 2,
        createdAt: new Date("2026-03-15"),
        updatedAt: new Date("2026-03-15"),
    },
    {
        id: "rv03",
        customerName: "Tariq Hassan",
        location: "Islamabad, Pakistan",
        rating: 4,
        title: "Very good value — great flights at competitive prices",
        body: "Found flight prices that were significantly lower than any other site I checked. Booking was smooth and customer support replied promptly when I had a query about baggage allowance.",
        tripType: "Business",
        isVerified: true,
        isPublished: true,
        sortOrder: 3,
        createdAt: new Date("2026-03-22"),
        updatedAt: new Date("2026-03-22"),
    },
];

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get("all") === "true";
    const publishedOnly = !fetchAll;

    if (shouldBypassDatabase()) {
        const list = publishedOnly
            ? DUMMY_REVIEWS.filter((r) => r.isPublished)
            : DUMMY_REVIEWS;
        return NextResponse.json(list, {
            headers: { "x-review-source": "dummy" },
        });
    }

    try {
        const rows = await prisma.customerReview.findMany({
            where: publishedOnly ? { isPublished: true } : undefined,
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        });
        return NextResponse.json(rows);
    } catch (err) {
        markDatabaseUnavailable();
        console.error("[reviews GET]", err);
        const list = publishedOnly
            ? DUMMY_REVIEWS.filter((r) => r.isPublished)
            : DUMMY_REVIEWS;
        return NextResponse.json(list, {
            headers: { "x-review-source": "dummy" },
        });
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

        const review = await prisma.customerReview.create({
            data: {
                customerName: body.customerName.trim(),
                location: body.location?.trim() || null,
                rating,
                title: body.title.trim(),
                body: body.body.trim(),
                tripType: body.tripType?.trim() || null,
                isVerified: body.isVerified ?? false,
                isPublished: body.isPublished ?? false,
                sortOrder: Number(body.sortOrder) || 0,
            },
        });

        return NextResponse.json(review, { status: 201 });
    } catch (err) {
        console.error("[reviews POST]", err);
        return NextResponse.json(
            { error: "Failed to create review" },
            { status: 500 },
        );
    }
}
