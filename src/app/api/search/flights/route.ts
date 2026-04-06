import { NextRequest, NextResponse } from "next/server";

import { prisma, shouldBypassDatabase } from "@/lib/db";
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

    if (!shouldBypassDatabase()) {
        try {
            const provider =
                result.source === "sabre"
                    ? "SABRE"
                    : result.source === "amadeus"
                        ? "AMADEUS"
                        : "INTERNAL";

            await prisma.flightSearchLog.create({
                data: {
                    origin: result.query.origin,
                    destination: result.query.destination,
                    departureDate: new Date(`${result.query.departureDate}T00:00:00.000Z`),
                    returnDate: result.query.returnDate
                        ? new Date(`${result.query.returnDate}T00:00:00.000Z`)
                        : null,
                    adults: result.query.adults,
                    children: result.query.children,
                    infants: result.query.infants,
                    cabinClass: result.query.cabinClass,
                    provider,
                    requestPayload: result.query,
                    responsePayload: {
                        source: result.source,
                        resultCount: result.results.length,
                    },
                },
            });
        } catch {
            // Keep search response resilient even if logging fails.
        }
    }

    return NextResponse.json({
        ok: true,
        query: result.query,
        results: result.results,
        source: result.source,
        warnings: result.warnings,
    });
}