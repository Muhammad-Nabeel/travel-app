import { NextRequest, NextResponse } from "next/server";

import { hotelResults } from "@/lib/mock-data";
import { hotelSearchSchema } from "@/lib/validations/search";

export function GET(request: NextRequest) {
    const parseResult = hotelSearchSchema.safeParse({
        city: request.nextUrl.searchParams.get("city") ?? "Makkah",
        checkInDate: request.nextUrl.searchParams.get("checkInDate") ?? "2026-04-12",
        checkOutDate: request.nextUrl.searchParams.get("checkOutDate") ?? "2026-04-17",
        guests: request.nextUrl.searchParams.get("guests") ?? "2",
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
        results: hotelResults,
        note: "Replace mock results with Sabre and Amadeus adapters.",
    });
}