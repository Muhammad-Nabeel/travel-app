import { NextRequest, NextResponse } from "next/server";
import { searchAirports } from "@/lib/aviation-reference";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim().toLowerCase() || "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = searchAirports(query, 8);

  return NextResponse.json({ results });
}