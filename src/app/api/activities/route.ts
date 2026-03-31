import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { activitySchema } from "@/lib/validations/activity";

export type ActivityRow = {
    id: string;
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
};

export const DUMMY_ACTIVITIES: ActivityRow[] = [
    { id: "a01", destinationId: "d01", title: "Dubai Desert Safari", category: "adventure", description: "Experience the thrill of desert dunes", imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400", cost: "PKR 8,500", reviews: 4.8, reviewCount: 342, sortOrder: 1, isActive: true },
    { id: "a02", destinationId: "d01", title: "Burj Khalifa Visit", category: "tourist-attraction", description: "World's tallest building observation deck", imageUrl: "https://images.unsplash.com/photo-1518684029980-cf91ee70ee25?w=400", cost: "PKR 4,200", reviews: 4.6, reviewCount: 1205, sortOrder: 2, isActive: true },
    { id: "a03", destinationId: "d01", title: "Dubai Beach Club", category: "seaside", description: "Relax on pristine white sand beaches", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400", cost: "PKR 3,500", reviews: 4.5, reviewCount: 567, sortOrder: 3, isActive: true },
    { id: "a04", destinationId: "d02", title: "Al-Haram Ziyarat", category: "cultural", description: "Visit the Grand Mosque of Mecca", imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400", cost: "Free", reviews: 4.9, reviewCount: 5432, sortOrder: 4, isActive: true },
    { id: "a05", destinationId: "d02", title: "Jeddah Corniche", category: "seaside", description: "Scenic waterfront promenade", imageUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400", cost: "Free", reviews: 4.4, reviewCount: 289, sortOrder: 5, isActive: true },
    { id: "a06", destinationId: "d06", title: "Kuwait Towers", category: "tourist-attraction", description: "Iconic symbol of Kuwait City", imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400", cost: "PKR 2,800", reviews: 4.3, reviewCount: 421, sortOrder: 6, isActive: true },
    { id: "a07", destinationId: "d07", title: "London Eye Ride", category: "tourist-attraction", description: "Giant observation wheel on Thames", imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400", cost: "PKR 6,500", reviews: 4.7, reviewCount: 3421, sortOrder: 7, isActive: true },
    { id: "a08", destinationId: "d07", title: "Sunday Market Tour", category: "shopping", description: "Browse vintage and local crafts", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561a1a?w=400", cost: "Free", reviews: 4.2, reviewCount: 654, sortOrder: 8, isActive: true },
];

function jsonWithSource(data: ActivityRow[], source: "db" | "dummy") {
    return NextResponse.json(data, {
        headers: { "x-activity-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";
    const destinationId = request.nextUrl.searchParams.get("destinationId");

    if (shouldBypassDatabase()) {
        let filtered = DUMMY_ACTIVITIES.filter((a) => showAll || a.isActive);
        if (destinationId) {
            filtered = filtered.filter((a) => a.destinationId === destinationId);
        }
        return jsonWithSource(filtered, "dummy");
    }

    try {
        const where: any = showAll ? {} : { isActive: true };
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

        if (showAll) {
            return jsonWithSource([], "db");
        }

        let filtered = DUMMY_ACTIVITIES.filter((a) => a.isActive);
        if (destinationId) {
            filtered = filtered.filter((a) => a.destinationId === destinationId);
        }
        return jsonWithSource(filtered, "dummy");
    } catch (error) {
        markDatabaseUnavailable(error);
        let filtered = DUMMY_ACTIVITIES.filter((a) => showAll || a.isActive);
        if (destinationId) {
            filtered = filtered.filter((a) => a.destinationId === destinationId);
        }
        return jsonWithSource(filtered, "dummy");
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = activitySchema.parse(body);

        const activity = await prisma.activity.create({
            data: {
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
            },
        });
        return NextResponse.json(activity, { status: 201 });
    } catch (err: any) {
        if (err?.issues && Array.isArray(err.issues)) {
            const message = err.issues
                .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
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
