import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { destinationSchema } from "@/lib/validations/destination";

export type DestinationRow = {
    id: string;
    city: string;
    country: string;
    iataCode: string | null;
    fare: string;
    notes: string | null;
    gradient: string;
    sortOrder: number;
    isActive: boolean;
};

export const DUMMY_DESTINATIONS: DestinationRow[] = [
    { id: "d01", city: "Dubai", country: "UAE", iataCode: "DXB", fare: "PKR 38,400", notes: "Round-trip from Karachi", gradient: "blue", sortOrder: 1, isActive: true },
    { id: "d02", city: "Jeddah", country: "Saudi Arabia", iataCode: "JED", fare: "PKR 89,000", notes: "Umrah gateway", gradient: "teal", sortOrder: 2, isActive: true },
    { id: "d03", city: "Madinah", country: "Saudi Arabia", iataCode: "MED", fare: "PKR 91,500", notes: "Ziyarat destination", gradient: "navy", sortOrder: 3, isActive: true },
    { id: "d04", city: "Istanbul", country: "Turkey", iataCode: "IST", fare: "PKR 104,252", notes: "Europe gateway", gradient: "purple", sortOrder: 4, isActive: true },
    { id: "d05", city: "Bangkok", country: "Thailand", iataCode: "BKK", fare: "PKR 127,837", notes: "Southeast Asia hub", gradient: "ocean", sortOrder: 5, isActive: true },
    { id: "d06", city: "Kuwait City", country: "Kuwait", iataCode: "KWI", fare: "PKR 72,290", notes: "Gulf direct", gradient: "dark", sortOrder: 6, isActive: true },
    { id: "d07", city: "London", country: "UK", iataCode: "LHR", fare: "PKR 189,000", notes: "Heathrow non-stop", gradient: "sunset", sortOrder: 7, isActive: true },
    { id: "d08", city: "Kuala Lumpur", country: "Malaysia", iataCode: "KUL", fare: "PKR 134,500", notes: "Popular with families", gradient: "teal", sortOrder: 8, isActive: true },
    { id: "d09", city: "Muscat", country: "Oman", iataCode: "MCT", fare: "PKR 54,200", notes: "Short-haul Gulf", gradient: "ocean", sortOrder: 9, isActive: true },
    { id: "d10", city: "Toronto", country: "Canada", iataCode: "YYZ", fare: "PKR 241,000", notes: "Long-haul via Gulf", gradient: "navy", sortOrder: 10, isActive: true },
    { id: "d11", city: "Riyadh", country: "Saudi Arabia", iataCode: "RUH", fare: "PKR 78,600", notes: "Business & Umrah", gradient: "blue", sortOrder: 11, isActive: true },
    { id: "d12", city: "Doha", country: "Qatar", iataCode: "DOH", fare: "PKR 61,800", notes: "Qatar Airways hub", gradient: "dark", sortOrder: 12, isActive: true },
];

function jsonWithSource(data: DestinationRow[], source: "db" | "dummy") {
    return NextResponse.json(data, {
        headers: { "x-destination-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    if (shouldBypassDatabase()) {
        return jsonWithSource(
            DUMMY_DESTINATIONS.filter((d) => showAll || d.isActive),
            "dummy",
        );
    }

    try {
        const rows = await prisma.destination.findMany({
            where: showAll ? undefined : { isActive: true },
            orderBy: { sortOrder: "asc" },
        });

        if (rows.length) {
            return jsonWithSource(rows, "db");
        }

        if (showAll) {
            return jsonWithSource([], "db");
        }

        return jsonWithSource(
            DUMMY_DESTINATIONS.filter((d) => d.isActive),
            "dummy",
        );
    } catch (error) {
        markDatabaseUnavailable(error);
        return jsonWithSource(
            DUMMY_DESTINATIONS.filter((d) => showAll || d.isActive),
            "dummy",
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = destinationSchema.parse(body);

        const destination = await prisma.destination.create({
            data: {
                city: validatedData.city,
                country: validatedData.country,
                fare: validatedData.fare,
                iataCode: validatedData.iataCode,
                notes: validatedData.notes,
                gradient: validatedData.gradient,
                sortOrder: validatedData.sortOrder,
                isActive: validatedData.isActive,
            },
        });
        return NextResponse.json(destination, { status: 201 });
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
