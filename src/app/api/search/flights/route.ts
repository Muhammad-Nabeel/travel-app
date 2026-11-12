import { NextRequest, NextResponse } from "next/server";

import { recordFlightSearch } from "@/lib/flights/search-log";
import { searchFlights } from "@/lib/flights/search-service";

export async function GET(request: NextRequest) {
    const result = await searchFlights(request.nextUrl.searchParams);

    if (!result.ok) {
        return NextResponse.json(
            {
                ok: false,
                errors: result.errors,
            },
            { status: 400 },
        );
    }

    recordFlightSearch(result);

    return NextResponse.json({
        ok: true,
        query: result.query,
        results: result.results,
        source: result.source,
        warnings: result.warnings,
    });
}