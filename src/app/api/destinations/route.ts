import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma, markDatabaseUnavailable, shouldBypassDatabase } from "@/lib/db";
import { destinationSchema } from "@/lib/validations/destination";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export type DestinationRow = {
    id: string;
    slug: string | null;
    city: string;
    country: string;
    scope: "DOMESTIC" | "INTERNATIONAL";
    tagline: string | null;
    overview: string | null;
    highlights: string[];
    travelTips: string[];
    bestTimeToVisit: string | null;
    idealStay: string | null;
    currency: string | null;
    timezone: string | null;
    language: string | null;
    iataCode: string | null;
    imageUrl: string | null;
    fare: string;
    notes: string | null;
    gradient: string;
    sortOrder: number;
    isActive: boolean;
    seoTitle: string;
    seoDescription: string;
};

function toSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}

async function getUniqueDestinationSlug(city: string) {
    const baseSlug = toSlug(city) || "destination";

    for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
        const existing = await prisma.destination.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existing) {
            return candidate;
        }
    }

    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
}

function jsonWithSource(data: DestinationRow[], source: "db" | "dummy") {
    return NextResponse.json(data, {
        headers: { "x-destination-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    if (shouldBypassDatabase()) {
        return jsonWithSource([], "db");
    }

    try {
        const rows = await prisma.destination.findMany({
            where: showAll ? undefined : { isActive: true },
            orderBy: { sortOrder: "asc" },
        });

        if (rows.length) {
            return jsonWithSource(rows.map((r) => ({
                ...r,
                highlights: (r.highlights as string[] | null) ?? [],
                travelTips: (r.travelTips as string[] | null) ?? [],
            })) as DestinationRow[], "db");
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
        const validatedData = destinationSchema.parse(body);

        const destination = await prisma.destination.create({
            data: {
                slug: await getUniqueDestinationSlug(validatedData.city),
                city: validatedData.city,
                country: validatedData.country,
                scope: validatedData.scope,
                tagline: validatedData.tagline,
                overview: validatedData.overview,
                highlights: validatedData.highlights,
                travelTips: validatedData.travelTips,
                bestTimeToVisit: validatedData.bestTimeToVisit,
                idealStay: validatedData.idealStay,
                currency: validatedData.currency,
                timezone: validatedData.timezone,
                language: validatedData.language,
                fare: validatedData.fare,
                iataCode: validatedData.iataCode,
                imageUrl: validatedData.imageUrl,
                notes: validatedData.notes,
                gradient: validatedData.gradient,
                sortOrder: validatedData.sortOrder,
                isActive: validatedData.isActive,
                seoTitle: validatedData.seoTitle,
                seoDescription: validatedData.seoDescription,
            },
        });
        revalidatePublicSite();
        return NextResponse.json(destination, { status: 201 });
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
