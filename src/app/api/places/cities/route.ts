import { NextRequest, NextResponse } from "next/server";

import { searchCities } from "@/lib/aviation-reference";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";

    if (query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const results = searchCities(query, 10);

    return NextResponse.json({ results });
}
