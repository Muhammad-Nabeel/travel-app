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
    createdAt: string;
    updatedAt: string;
};

export const DUMMY_PACKAGES: PackageRow[] = [
    {
        id: "p01",
        slug: "ramadan-premium-2026",
        title: "Ramadan Premium Umrah 2026",
        subtitle: "Premium stay near Haram with full support",
        description:
            "A premium package with Makkah and Madinah stays, guided support, and curated hotel options close to the Haram.",
        makkahNights: 7,
        madinahNights: 3,
        departureCity: "Lahore",
        airlineNotes: "Saudia direct flight",
        hotelSummary: "Swissotel Makkah + Hilton Madinah",
        inclusions: [
            "Return air ticket",
            "4-star hotel accommodation",
            "Airport transfers",
            "Visa processing",
            "Guided Ziyarat tours",
        ],
        exclusions: ["Personal expenses", "Room upgrades", "Travel insurance"],
        basePrice: 8950,
        currency: "SAR",
        seatsAvailable: 20,
        startDate: "2026-04-10T00:00:00Z",
        endDate: "2026-04-20T00:00:00Z",
        status: "PUBLISHED",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
    },
    {
        id: "p02",
        slug: "family-comfort-umrah-2026",
        title: "Family Comfort Umrah 2026",
        subtitle: "Balanced comfort for families of all sizes",
        description:
            "Designed for families with balanced hotel comfort, airport assistance, and flexible rooming arrangements.",
        makkahNights: 8,
        madinahNights: 4,
        departureCity: "Karachi",
        airlineNotes: "Emirates via Dubai",
        hotelSummary: "Mövenpick Hajar Tower + Al Salam Royal",
        inclusions: [
            "Return air ticket",
            "Family room accommodation",
            "Airport & hotel transfers",
            "Visa processing",
            "Ziyarat transport",
            "Welcome meal",
        ],
        exclusions: ["Personal shopping", "Laundry", "Travel insurance"],
        basePrice: 7200,
        currency: "SAR",
        seatsAvailable: 40,
        startDate: "2026-05-01T00:00:00Z",
        endDate: "2026-05-13T00:00:00Z",
        status: "PUBLISHED",
        createdAt: "2026-01-05T00:00:00Z",
        updatedAt: "2026-01-05T00:00:00Z",
    },
    {
        id: "p03",
        slug: "economy-weekend-umrah",
        title: "Economy Weekend Umrah",
        subtitle: "Short stay with transparent inclusions",
        description:
            "An entry package for short stays with transparent inclusions and optional add-ons managed by the admin team.",
        makkahNights: 5,
        madinahNights: 2,
        departureCity: "Islamabad",
        airlineNotes: "PIA direct to Madinah",
        hotelSummary: "Dar Al Salam + Oberoi Madinah",
        inclusions: [
            "Return air ticket",
            "3-star hotel accommodation",
            "Airport transfers",
            "Visa processing",
        ],
        exclusions: [
            "Meals",
            "Personal expenses",
            "Ziyarat tours",
            "Travel insurance",
        ],
        basePrice: 5400,
        currency: "SAR",
        seatsAvailable: 30,
        startDate: "2026-04-25T00:00:00Z",
        endDate: "2026-05-02T00:00:00Z",
        status: "DRAFT",
        createdAt: "2026-01-10T00:00:00Z",
        updatedAt: "2026-01-10T00:00:00Z",
    },
];

function slugify(title: string) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

function jsonWithSource(data: PackageRow[], source: "db" | "dummy") {
    return NextResponse.json(data, {
        headers: { "x-package-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    if (shouldBypassDatabase()) {
        const filtered = DUMMY_PACKAGES.filter(
            (p) => showAll || p.status === "PUBLISHED",
        );
        return jsonWithSource(filtered, "dummy");
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
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }));

        if (mapped.length > 0 || showAll) {
            return jsonWithSource(mapped, "db");
        }

        return jsonWithSource(DUMMY_PACKAGES.filter((p) => showAll || p.status === "PUBLISHED"), "dummy");
    } catch (err) {
        markDatabaseUnavailable(err);
        return jsonWithSource(
            DUMMY_PACKAGES.filter((p) => showAll || p.status === "PUBLISHED"),
            "dummy",
        );
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
