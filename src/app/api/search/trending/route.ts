import { NextResponse } from "next/server";

import { getAirportRef } from "@/lib/aviation-reference";
import { prisma, shouldBypassDatabase } from "@/lib/db";

const TRENDING_WINDOW_DAYS = 7;
const TRENDING_LIMIT = 10;

export async function GET() {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: true, routes: [] });
    }

    try {
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - TRENDING_WINDOW_DAYS);

        const grouped = await prisma.flightSearchLog.groupBy({
            by: ["origin", "destination"],
            where: {
                searchedAt: {
                    gte: since,
                },
            },
            _count: {
                _all: true,
            },
            orderBy: {
                _count: {
                    id: "desc",
                },
            },
            take: TRENDING_LIMIT,
        });

        const routes = grouped.map((entry: (typeof grouped)[number]) => {
            const originRef = getAirportRef(entry.origin);
            const destinationRef = getAirportRef(entry.destination);

            return {
                origin: originRef?.city ?? entry.origin,
                destination: destinationRef?.city ?? entry.destination,
                originIata: entry.origin,
                destinationIata: entry.destination,
                searches: entry._count._all,
            };
        });

        return NextResponse.json({ ok: true, routes });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Failed to load trending searches",
            },
            { status: 503 },
        );
    }
}
