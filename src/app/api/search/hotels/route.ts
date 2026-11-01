import { NextRequest, NextResponse } from "next/server";

import { hotelSearchSchema } from "@/lib/validations/search";

export function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const parseResult = hotelSearchSchema.safeParse({
        destination: params.get("destination") ?? undefined,
        checkIn: params.get("checkIn") ?? undefined,
        checkOut: params.get("checkOut") ?? undefined,
        adults: params.get("adults") ?? undefined,
        children: params.get("children") ?? undefined,
        rooms: params.get("rooms") ?? undefined,
        stayType: params.get("stayType") ?? undefined,
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
        // No hotel provider is connected yet.
        results: [],
    });
}