import { getActiveSabreSettings } from "@/lib/admin-settings/sabre-settings";
import { signOffers } from "@/lib/flights/offer-signature";
import { searchSabreFlights } from "@/lib/providers/sabre/flight-search";
import { flightSearchSchema } from "@/lib/validations/search";

import type {
    FlightOffer,
    FlightSearchQuery,
    FlightSearchResult,
} from "@/lib/flights/types";

type SearchInput = URLSearchParams | Record<string, string | undefined>;

function parseLegsPayload(raw: string | undefined) {
    if (!raw) return undefined;

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return undefined;

        return parsed
            .filter((item): item is { origin?: string; destination?: string; departureDate?: string } =>
                Boolean(item && typeof item === "object"),
            )
            .map((item) => ({
                origin: String(item.origin ?? ""),
                destination: String(item.destination ?? ""),
                departureDate: String(item.departureDate ?? ""),
            }));
    } catch {
        return undefined;
    }
}

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
            legs: parseLegsPayload(input.get("legs") ?? undefined),
            adults: input.get("adults") ?? undefined,
            children: input.get("children") ?? undefined,
            infants: input.get("infants") ?? undefined,
            cabinClass: input.get("cabinClass") ?? undefined,
            currency: input.get("currency") ?? undefined,
            directOnly: input.get("directOnly") ?? undefined,
        };
    }

    return {
        tripType: input.tripType,
        origin: input.origin,
        destination: input.destination,
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        legs: parseLegsPayload(input.legs),
        adults: input.adults,
        children: input.children,
        infants: input.infants,
        cabinClass: input.cabinClass,
        currency: input.currency,
        directOnly: input.directOnly,
    };
}

function applyQueryFilters(offers: FlightOffer[], query: FlightSearchQuery) {
    if (query.tripType === "multi-city") {
        return offers.filter((offer) => {
            if (query.directOnly && offer.stops > 0) {
                return false;
            }

            return true;
        });
    }

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
        legs: normalized.legs,
        adults: normalized.adults ?? "1",
        children: normalized.children ?? "0",
        infants: normalized.infants ?? "0",
        cabinClass: normalized.cabinClass ?? "Economy",
        currency: normalized.currency ?? "PKR",
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

const NO_LIVE_FARES_MESSAGE =
    "We couldn't find live fares for this search. Send us your trip details and a travel adviser will get back to you with a quote.";
const LIVE_SEARCH_UNAVAILABLE_MESSAGE =
    "Live fares are temporarily unavailable. Send us your trip details and a travel adviser will get back to you with a quote.";

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
    const sabreSettings = await getActiveSabreSettings();

    if (!sabreSettings) {
        return {
            ok: true,
            query,
            results: [],
            source: "none",
            warnings: [],
            liveSearchEnabled: false,
        };
    }

    try {
        const sabreResults = await searchSabreFlights(query, sabreSettings);
        const filteredResults = applyQueryFilters(sabreResults, query);

        return {
            ok: true,
            query,
            results: signOffers(filteredResults, query),
            source: "sabre",
            warnings: filteredResults.length > 0 ? [] : [NO_LIVE_FARES_MESSAGE],
            liveSearchEnabled: true,
        };
    } catch (error) {
        // Provider details (endpoints, status codes, credentials hints) stay in the server log.
        console.error("[flight-search] Live search failed:", error);
        return {
            ok: true,
            query,
            results: [],
            source: "sabre",
            warnings: [LIVE_SEARCH_UNAVAILABLE_MESSAGE],
            liveSearchEnabled: true,
        };
    }
}
