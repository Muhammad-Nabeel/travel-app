import { NextRequest, NextResponse } from "next/server";

import { searchSabreFareCalendar } from "@/lib/providers/sabre/flight-search";

function asIsoDate(value: string | null) {
    if (!value) return "";
    const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
    return match ? value : "";
}

function codeFrom(input: string | null) {
    if (!input) return "";
    const upper = input.toUpperCase();
    const match = upper.match(/[A-Z]{3}/);
    return match ? match[0] : "";
}

function daysBetween(start: string, end: string) {
    const startMs = Date.parse(`${start}T00:00:00.000Z`);
    const endMs = Date.parse(`${end}T00:00:00.000Z`);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        return null;
    }
    const days = Math.round((endMs - startMs) / 86_400_000);
    return days > 0 ? days : null;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const origin = codeFrom(searchParams.get("origin"));
    const destination = codeFrom(searchParams.get("destination"));
    const cabinClass = (searchParams.get("cabinClass") as
        | "Economy"
        | "Premium Economy"
        | "Business"
        | "First"
        | null) ?? "Economy";
    const tripType = searchParams.get("tripType") === "round-trip" ? "round-trip" : "one-way";
    const selectedDepartureDate = asIsoDate(searchParams.get("departureDate"));
    const selectedReturnDate = asIsoDate(searchParams.get("returnDate"));
    const derivedLengthOfStay =
        tripType === "round-trip" && selectedDepartureDate && selectedReturnDate
            ? daysBetween(selectedDepartureDate, selectedReturnDate)
            : null;

    if (!origin || !destination) {
        return NextResponse.json(
            {
                ok: false,
                error: "Origin and destination airport codes are required.",
            },
            { status: 400 },
        );
    }

    if (!selectedDepartureDate) {
        return NextResponse.json(
            {
                ok: false,
                error: "Departure date is required.",
            },
            { status: 400 },
        );
    }

    try {
        // Only fetch fares for the next 7 days from the selected departure date
        const fares = await searchSabreFareCalendar({
            origin,
            destination,
            departureDate: selectedDepartureDate,
            lengthOfStay: derivedLengthOfStay ?? 7,
            cabinClass,
            tripType,
        });

        return NextResponse.json({
            ok: true,
            source: "sabre",
            fares: fares
                .sort((a, b) => a.date.localeCompare(b.date)),
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? `Sabre fare calendar unavailable: ${error.message}`
                        : "Sabre fare calendar unavailable right now.",
            },
            { status: 503 },
        );
    }
}
