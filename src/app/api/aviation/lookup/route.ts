import { NextResponse } from "next/server";

import { getAirlineName, getAirportRef } from "@/lib/aviation-reference";

function parseList(value: string | null, maxItems: number, maxLen: number) {
    if (!value) return [] as string[];

    return value
        .split(",")
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, maxItems)
        .map((v) => v.slice(0, maxLen));
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const airportCodes = parseList(searchParams.get("airports"), 200, 3);
    const airlineCodes = parseList(searchParams.get("airlines"), 100, 3);

    const airports: Record<
        string,
        { iata: string; city: string; country: string; airportName: string }
    > = {};

    for (const code of airportCodes) {
        const ref = getAirportRef(code);
        if (!ref) continue;
        airports[code] = {
            iata: ref.iata,
            city: ref.city,
            country: ref.country,
            airportName: ref.airportName,
        };
    }

    const airlines: Record<string, string> = {};
    for (const code of airlineCodes) {
        const name = getAirlineName(code);
        if (!name) continue;
        airlines[code] = name;
    }

    return NextResponse.json({ airports, airlines });
}
