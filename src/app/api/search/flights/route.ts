import { NextRequest, NextResponse } from "next/server";

import { flightResults } from "@/lib/mock-data";
import { flightSearchSchema } from "@/lib/validations/search";

export function GET(request: NextRequest) {
    const parseResult = flightSearchSchema.safeParse({
        origin: request.nextUrl.searchParams.get("origin") ?? "LHE",
        destination: request.nextUrl.searchParams.get("destination") ?? "JED",
        departureDate: request.nextUrl.searchParams.get("departureDate") ?? "2026-04-12",
        adults: request.nextUrl.searchParams.get("adults") ?? "1",
    });

    if (!parseResult.success) {
        return NextResponse.json(
            {
                ok: false,
                errors: parseResult.error.flatten(),
            },
            { status: 400 },
        );
    }

    return NextResponse.json({
        ok: true,
        query: parseResult.data,
        results: flightResults,
        note: "Replace mock results with Sabre and Amadeus adapters.",
    });
}