import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { packageSchema } from "@/lib/validations/package";

export type PackageRow = {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string;
    makkahNights: number;
    madinahNights: number;
    departureCity: string;
    airlineNotes: string | null;
    hotelSummary: string | null;
    inclusions: string[];
    exclusions: string[];
    basePrice: number;
    currency: string;
    seatsAvailable: number;
    startDate: string;
    endDate: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    seoTitle: string;
    seoDescription: string;
    createdAt: string;
    updatedAt: string;
};

function slugify(title: string) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

function jsonWithSource(data: PackageRow[], source: "db" | "offline") {
    return NextResponse.json(data, {
        headers: { "x-package-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    if (shouldBypassDatabase()) {
        return jsonWithSource([], "offline");
    }

    try {
        const rows = await prisma.umrahPackage.findMany({
            where: showAll ? undefined : { status: "PUBLISHED" },
            orderBy: { startDate: "asc" },
        });

        const mapped: PackageRow[] = rows.map((r) => ({
            id: r.id,
            slug: r.slug,
            title: r.title,
            subtitle: r.subtitle,
            description: r.description,
            makkahNights: r.makkahNights,
            madinahNights: r.madinahNights,
            departureCity: r.departureCity,
            airlineNotes: r.airlineNotes,
            hotelSummary: r.hotelSummary,
            inclusions: r.inclusions as string[],
            exclusions: r.exclusions as string[],
            basePrice: Number(r.basePrice),
            currency: r.currency,
            seatsAvailable: r.seatsAvailable,
            startDate: r.startDate.toISOString(),
            endDate: r.endDate.toISOString(),
            status: r.status as PackageRow["status"],
            seoTitle: r.seoTitle,
            seoDescription: r.seoDescription,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }));

        return jsonWithSource(mapped, "db");
    } catch (err) {
        markDatabaseUnavailable(err);
        return jsonWithSource([], "offline");
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = packageSchema.parse(body);

        if (shouldBypassDatabase()) {
            return NextResponse.json(
                { ok: false, error: "Database not configured — cannot persist packages in demo mode." },
                { status: 503 },
            );
        }

        const slug = slugify(data.title) + "-" + Date.now().toString(36);

        const pkg = await prisma.umrahPackage.create({
            data: {
                slug,
                title: data.title,
                subtitle: data.subtitle ?? null,
                description: data.description,
                makkahNights: data.makkahNights,
                madinahNights: data.madinahNights,
                departureCity: data.departureCity,
                airlineNotes: data.airlineNotes ?? null,
                hotelSummary: data.hotelSummary ?? null,
                inclusions: data.inclusions,
                exclusions: data.exclusions,
                basePrice: data.basePrice,
                currency: data.currency,
                seatsAvailable: data.seatsAvailable,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                status: data.status,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
            },
        });

        return NextResponse.json(pkg, { status: 201 });
    } catch (err: unknown) {
        if (err && typeof err === "object" && "issues" in err) {
            const issues = (err as { issues: Array<{ path: string[]; message: string }> }).issues;
            const message = issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
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
        return NextResponse.json({ ok: false, error: "Create failed" }, { status: 503 });
    }
}
