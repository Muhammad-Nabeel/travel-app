import { NextResponse } from "next/server";

import { getAirportRef } from "@/lib/aviation-reference";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

const TRENDING_WINDOW_DAYS = 7;
const TRENDING_LIMIT = 10;

// The flight search box on the homepage and every destination and route page
// fetches this on load. A week of searches barely moves in an hour, so the
// grouped result is cached instead of re-counted for every visitor.
export const revalidate = 3600;

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
        // Throw rather than return an error response: Next would cache that for
        // the hour, while a failed refresh keeps serving the last good list.
        // The search box shows no trending routes when the request fails.
        markDatabaseUnavailable(error);
        throw error;
    }
}
