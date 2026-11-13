import { stableOfferId } from "@/lib/providers/sabre/flight-search";
import type { FlightLeg } from "@/lib/flights/types";

function leg(flightNumber: string, departure: string): FlightLeg {
    return {
        legIndex: 0,
        origin: "LHE",
        destination: "DXB",
        departure,
        arrival: departure,
        stops: 0,
        segments: [
            {
                segmentIndex: 0,
                airline: "EK",
                flightNumber,
                origin: "LHE",
                destination: "DXB",
                departure,
                arrival: departure,
                cabin: "Economy",
                bookingClass: "Y",
                stops: 0,
            },
        ],
    };
}

const a = [leg("EK623", "2026-12-01T04:00:00")];
const b = [leg("EK625", "2026-12-01T21:00:00")];

describe("stableOfferId", () => {
    it("gives an offer the same id whatever its position in the response", () => {
        // The booking page re-runs the search; Sabre may return offers in another order.
        const first = [stableOfferId(a, 100, "PKR", new Map()), stableOfferId(b, 120, "PKR", new Map())];
        const seen = new Map<string, number>();
        const reordered = [stableOfferId(b, 120, "PKR", seen), stableOfferId(a, 100, "PKR", seen)];
        expect(reordered).toEqual([first[1], first[0]]);
    });

    it("changes when the price changes, so a repriced fare is not booked silently", () => {
        expect(stableOfferId(a, 100, "PKR", new Map())).not.toBe(stableOfferId(a, 101, "PKR", new Map()));
    });

    it("keeps duplicate itineraries unique within one response", () => {
        const seen = new Map<string, number>();
        const first = stableOfferId(a, 100, "PKR", seen);
        const second = stableOfferId(a, 100, "PKR", seen);
        expect(second).not.toBe(first);
    });
});
