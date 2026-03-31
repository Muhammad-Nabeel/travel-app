import { flightResults } from "@/lib/mock-data";
import { searchSabreFlights } from "@/lib/providers/sabre/flight-search";
import { flightSearchSchema } from "@/lib/validations/search";

import type {
    FlightLeg,
    FlightOffer,
    FlightSearchQuery,
    FlightSearchResult,
} from "@/lib/flights/types";

type SearchInput = URLSearchParams | Record<string, string | undefined>;

function getTodayDateISO() {
    return new Date().toISOString().slice(0, 10);
}

function normalizeSearchInput(input: SearchInput) {
    if (input instanceof URLSearchParams) {
        return {
            tripType: input.get("tripType") ?? undefined,
            origin: input.get("origin") ?? undefined,
            destination: input.get("destination") ?? undefined,
            departureDate: input.get("departureDate") ?? undefined,
            returnDate: input.get("returnDate") ?? undefined,
            adults: input.get("adults") ?? undefined,
            children: input.get("children") ?? undefined,
            infants: input.get("infants") ?? undefined,
            cabinClass: input.get("cabinClass") ?? undefined,
            directOnly: input.get("directOnly") ?? undefined,
        };
    }

    return {
        tripType: input.tripType,
        origin: input.origin,
        destination: input.destination,
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        adults: input.adults,
        children: input.children,
        infants: input.infants,
        cabinClass: input.cabinClass,
        directOnly: input.directOnly,
    };
}

function createMockLeg(params: {
    legIndex: number;
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departure: Date;
    arrival: Date;
}): FlightLeg {
    const durationMinutes = Math.max(
        Math.round((params.arrival.getTime() - params.departure.getTime()) / 60000),
        0,
    );

    return {
        legIndex: params.legIndex,
        origin: params.origin,
        destination: params.destination,
        departure: params.departure.toISOString(),
        arrival: params.arrival.toISOString(),
        durationMinutes,
        stops: 0,
        segments: [
            {
                segmentIndex: 0,
                airline: params.airline,
                flightNumber: params.flightNumber,
                origin: params.origin,
                destination: params.destination,
                departure: params.departure.toISOString(),
                arrival: params.arrival.toISOString(),
                durationMinutes,
                cabin: "Economy",
                stops: 0,
            },
        ],
    };
}

function mapMockDataToOffers(query?: FlightSearchQuery): FlightOffer[] {
    return flightResults.map((flight, index) => {
        const departureDate = new Date(flight.departure);
        const arrivalDate = new Date(flight.arrival);
        const flightNumber = flight.id.split("-").slice(0, 2).join(" ");
        const outboundLeg = createMockLeg({
            legIndex: 0,
            airline: flight.airline,
            flightNumber,
            origin: flight.origin,
            destination: flight.destination,
            departure: departureDate,
            arrival: arrivalDate,
        });
        const outboundPrice = Number(flight.price);

        if (query?.tripType === "round-trip") {
            const baseReturnDate = query.returnDate
                ? new Date(query.returnDate)
                : new Date(departureDate.getTime() + 5 * 24 * 60 * 60 * 1000);
            const rtDepartureDate = new Date(baseReturnDate);
            rtDepartureDate.setHours(
                Math.floor(Math.random() * 12) + 8,
                Math.floor(Math.random() * 60),
            );
            const rtArrivalDate = new Date(rtDepartureDate);
            rtArrivalDate.setHours(
                rtArrivalDate.getHours() + Math.max(Math.round(outboundLeg.durationMinutes! / 60), 2),
            );
            const returnLeg = createMockLeg({
                legIndex: 1,
                airline: flight.airline,
                flightNumber,
                origin: flight.destination,
                destination: flight.origin,
                departure: rtDepartureDate,
                arrival: rtArrivalDate,
            });
            const returnPrice = Math.ceil(outboundPrice * 0.95);

            return {
                id: `mock-roundtrip-${index + 1}`,
                provider: "Mock",
                airline: flight.airline,
                origin: outboundLeg.origin,
                destination: outboundLeg.destination,
                departure: outboundLeg.departure,
                arrival: outboundLeg.arrival,
                durationMinutes: outboundLeg.durationMinutes,
                stops: outboundLeg.stops,
                cabin: "Economy",
                price: outboundPrice + returnPrice,
                currency: flight.currency,
                flightNumber,
                legs: [outboundLeg, returnLeg],
            } satisfies FlightOffer;
        }

        return {
            id: flight.id || `mock-outbound-${index + 1}`,
            provider: "Mock",
            airline: flight.airline,
            origin: outboundLeg.origin,
            destination: outboundLeg.destination,
            departure: outboundLeg.departure,
            arrival: outboundLeg.arrival,
            durationMinutes: outboundLeg.durationMinutes,
            stops: outboundLeg.stops,
            cabin: "Economy",
            price: outboundPrice,
            currency: flight.currency,
            flightNumber,
            legs: [outboundLeg],
        } satisfies FlightOffer;
    });
}

function applyQueryFilters(offers: FlightOffer[], query: FlightSearchQuery) {
    return offers.filter((offer) => {
        if (query.directOnly && offer.stops > 0) {
            return false;
        }

        if (offer.origin && offer.origin !== query.origin) {
            return false;
        }

        if (offer.destination && offer.destination !== query.destination) {
            return false;
        }

        return true;
    });
}

export function parseFlightSearchQuery(input: SearchInput) {
    const normalized = normalizeSearchInput(input);
    const parseInput = {
        tripType: normalized.tripType,
        origin: normalized.origin,
        destination: normalized.destination,
        departureDate: normalized.departureDate ?? getTodayDateISO(),
        returnDate: normalized.returnDate,
        adults: normalized.adults ?? "1",
        children: normalized.children ?? "0",
        infants: normalized.infants ?? "0",
        cabinClass: normalized.cabinClass ?? "Economy",
        directOnly: normalized.directOnly ?? "false",
    };

    const result = flightSearchSchema.safeParse(parseInput);

    if (!result.success) {
        console.error("[Flight Search Validation Failed]", {
            input: parseInput,
            errors: result.error.flatten(),
        });
    }

    return result;
}

export async function searchFlights(input: SearchInput): Promise<FlightSearchResult> {
    const queryResult = parseFlightSearchQuery(input);

    if (!queryResult.success) {
        const flattened = queryResult.error.flatten();
        return {
            ok: false,
            errors: {
                formErrors: flattened.formErrors,
                fieldErrors: flattened.fieldErrors,
            },
        };
    }

    const query = queryResult.data;
    const warnings: string[] = [];

    try {
        const sabreResults = await searchSabreFlights(query);
        const filteredResults = applyQueryFilters(sabreResults, query);

        if (filteredResults.length > 0) {
            return {
                ok: true,
                query,
                results: filteredResults,
                source: "sabre",
                warnings,
            };
        }

        warnings.push(
            "Sabre returned no matching fares for the selected route. Showing seeded fares while integrations warm up.",
        );
    } catch (error) {
        warnings.push(
            error instanceof Error
                ? `Sabre search unavailable: ${error.message}`
                : "Sabre search unavailable right now.",
        );
    }

    const mockResults = applyQueryFilters(mapMockDataToOffers(query), query);

    return {
        ok: true,
        query,
        results: mockResults,
        source: "mock",
        warnings,
    };
}
