import { NextResponse } from "next/server";

import {
    listAirlineOptions,
    listAirportOptions,
} from "@/lib/aviation-reference";

const FARE_OPTIONS = [
    "Economy",
    "Premium Economy",
    "Business",
    "First",
] as const;

export async function GET() {
    return NextResponse.json(
        {
            airlines: listAirlineOptions(250),
            airports: listAirportOptions(250),
            fares: FARE_OPTIONS,
        },
        { status: 200 },
    );
}
