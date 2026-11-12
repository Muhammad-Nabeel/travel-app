import { after } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import type { FlightSearchSuccessResult } from "@/lib/flights/types";

/**
 * Search logs feed "trending searches" (last 7 days). Rows older than this
 * are deleted so the table, the largest by far, stops growing forever.
 */
export const SEARCH_LOG_RETENTION_DAYS = 90;

/** The sweep runs on roughly 1 in 200 searches; one indexed delete each time. */
const SWEEP_PROBABILITY = 1 / 200;

async function sweepOldSearchLogs() {
    const cutoff = new Date(Date.now() - SEARCH_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await prisma.flightSearchLog.deleteMany({
        where: { searchedAt: { lt: cutoff } },
    });
    if (count > 0) {
        console.info(`[search-log] Deleted ${count} searches older than ${SEARCH_LOG_RETENTION_DAYS} days.`);
    }
}

/**
 * Records a search after the response is sent, so customers never wait on
 * an analytics write. Failures are logged and never affect the search.
 */
export function recordFlightSearch(result: FlightSearchSuccessResult) {
    if (shouldBypassDatabase()) return;

    after(async () => {
        try {
            const provider =
                result.source === "sabre" ? "SABRE" : result.source === "amadeus" ? "AMADEUS" : "INTERNAL";

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

            if (Math.random() < SWEEP_PROBABILITY) await sweepOldSearchLogs();
        } catch (error) {
            markDatabaseUnavailable(error);
            console.error("[search-log] Failed to record search:", error);
        }
    });
}
