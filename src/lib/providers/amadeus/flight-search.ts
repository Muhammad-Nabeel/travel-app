import type {
    BaggageAllowance,
    CabinClass,
    FlightLeg,
    FlightOffer,
    FlightSearchQuery,
    FlightSegment,
    PassengerFare,
} from "@/lib/flights/types";

const AMADEUS_AUTH_PATH = "/v1/security/oauth2/token";
const AMADEUS_SHOP_PATH = "/v2/shopping/flight-offers";
const TOKEN_BUFFER_MS = 20_000;

type AmadeusTokenCache = {
    token: string;
    expiresAt: number;
};

let cachedToken: AmadeusTokenCache | null = null;

// ── Environment ───────────────────────────────────────────────────────────────

function getAmadeusEnv() {
    const baseUrl = process.env.AMADEUS_BASE_URL?.trim();
    const clientId = process.env.AMADEUS_CLIENT_ID?.trim();
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET?.trim();
    const currency = process.env.AMADEUS_CURRENCY?.trim() || "PKR";
    const maxOffers = parseInt(process.env.AMADEUS_MAX_OFFERS ?? "200", 10);

    if (!baseUrl || !clientId || !clientSecret) return null;

    return { baseUrl, clientId, clientSecret, currency, maxOffers };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getAmadeusAccessToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt - TOKEN_BUFFER_MS > now) {
        return cachedToken.token;
    }

    const env = getAmadeusEnv();
    if (!env) throw new Error("Amadeus credentials are missing in environment variables.");

    const response = await fetch(`${env.baseUrl}${AMADEUS_AUTH_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: env.clientId,
            client_secret: env.clientSecret,
        }).toString(),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `Amadeus token request failed (${response.status}): ${text.slice(0, 220)}`,
        );
    }

    const payload = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
    };
    if (!payload.access_token) {
        throw new Error("Amadeus token response did not include an access_token.");
    }

    cachedToken = {
        token: payload.access_token,
        expiresAt: now + (payload.expires_in ?? 1799) * 1000,
    };

    return payload.access_token;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDurationToMinutes(iso?: string): number | undefined {
    if (!iso) return undefined;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return undefined;
    return parseInt(match[1] ?? "0") * 60 + parseInt(match[2] ?? "0");
}

function mapAmadeusCabin(cabin?: string): CabinClass {
    switch (cabin?.toUpperCase()) {
        case "BUSINESS":
            return "Business";
        case "FIRST":
            return "First";
        case "PREMIUM_ECONOMY":
            return "Premium Economy";
        default:
            return "Economy";
    }
}

function mapCabinToAmadeus(cabin: CabinClass): string {
    switch (cabin) {
        case "Business":
            return "BUSINESS";
        case "First":
            return "FIRST";
        case "Premium Economy":
            return "PREMIUM_ECONOMY";
        default:
            return "ECONOMY";
    }
}

// ── Request builder ───────────────────────────────────────────────────────────

function buildAmadeusSearchPayload(
    query: FlightSearchQuery,
    env: NonNullable<ReturnType<typeof getAmadeusEnv>>,
) {
    const travelers = [
        ...Array.from({ length: query.adults }, (_, i) => ({
            id: String(i + 1),
            travelerType: "ADULT",
        })),
        ...Array.from({ length: query.children }, (_, i) => ({
            id: String(query.adults + i + 1),
            travelerType: "CHILD",
        })),
        ...Array.from({ length: query.infants }, (_, i) => ({
            id: String(query.adults + query.children + i + 1),
            travelerType: "HELD_INFANT",
        })),
    ];

    const originDestinations: object[] = [
        {
            id: "1",
            originLocationCode: query.origin,
            destinationLocationCode: query.destination,
            departureDateTimeRange: { date: query.departureDate },
        },
    ];

    if (query.tripType === "round-trip" && query.returnDate) {
        originDestinations.push({
            id: "2",
            originLocationCode: query.destination,
            destinationLocationCode: query.origin,
            departureDateTimeRange: { date: query.returnDate },
        });
    }

    return {
        currencyCode: query.currency || env.currency,
        originDestinations,
        travelers,
        sources: ["GDS"],
        searchCriteria: {
            maxFlightOffers: env.maxOffers,
            flightFilters: {
                ...(query.directOnly && {
                    connectionRestriction: { maxNumberOfStops: 0 },
                }),
                cabinRestrictions: [
                    {
                        cabin: mapCabinToAmadeus(query.cabinClass),
                        coverage: "MOST_SEGMENTS",
                        originDestinationIds: originDestinations.map((_, i) => String(i + 1)),
                    },
                ],
            },
        },
    };
}

// ── Amadeus response types ────────────────────────────────────────────────────

type AmadeusSegmentRaw = {
    id?: string;
    departure: { iataCode: string; terminal?: string; at: string };
    arrival: { iataCode: string; terminal?: string; at: string };
    carrierCode: string;
    number: string;
    aircraft?: { code: string };
    operating?: { carrierCode: string };
    duration?: string;
    numberOfStops?: number;
};

type AmadeusItineraryRaw = {
    duration?: string;
    segments: AmadeusSegmentRaw[];
};

type AmadeusFareDetail = {
    segmentId?: string;
    cabin?: string;
    class?: string;
    includedCheckedBags?: { quantity?: number; weight?: number; weightUnit?: string };
};

type AmadeusTravelerPricingRaw = {
    travelerId: string;
    travelerType: string;
    price?: { currency: string; total?: string; base?: string };
    fareDetailsBySegment?: AmadeusFareDetail[];
};

type AmadeusOfferRaw = {
    id?: string;
    itineraries?: AmadeusItineraryRaw[];
    price?: { currency: string; total?: string; grandTotal?: string };
    travelerPricings?: AmadeusTravelerPricingRaw[];
    validatingAirlineCodes?: string[];
    numberOfBookableSeats?: number;
};

// ── Response mapper ───────────────────────────────────────────────────────────

function mapAmadeusResponseToOffers(data: unknown): FlightOffer[] {
    if (!data || typeof data !== "object") return [];

    const root = data as { data?: AmadeusOfferRaw[] };
    const offers: FlightOffer[] = [];

    for (const offer of root.data ?? []) {
        const grandTotal = parseFloat(
            offer.price?.grandTotal ?? offer.price?.total ?? "0",
        );
        if (!grandTotal || Number.isNaN(grandTotal)) continue;

        const currency = offer.price?.currency ?? "USD";
        const itineraries = offer.itineraries ?? [];
        if (itineraries.length === 0) continue;

        // Build a segment-level fare-detail map for O(1) cabin/class lookup
        const fareBySegmentId = new Map<string, AmadeusFareDetail>();
        for (const tp of offer.travelerPricings ?? []) {
            for (const fd of tp.fareDetailsBySegment ?? []) {
                if (fd.segmentId) fareBySegmentId.set(fd.segmentId, fd);
            }
        }

        const legs: FlightLeg[] = itineraries.map((itin, legIndex) => {
            const segments: FlightSegment[] = itin.segments.map((seg, segIndex) => {
                const fareDetail = seg.id ? fareBySegmentId.get(seg.id) : undefined;
                const cabin = mapAmadeusCabin(fareDetail?.cabin);
                const airline = seg.carrierCode;
                const flightNumber = `${airline}${seg.number}`;
                const operatingAirline =
                    seg.operating?.carrierCode && seg.operating.carrierCode !== airline
                        ? seg.operating.carrierCode
                        : undefined;

                return {
                    segmentIndex: segIndex,
                    airline,
                    operatingAirline,
                    flightNumber,
                    aircraft: seg.aircraft?.code,
                    origin: seg.departure.iataCode,
                    destination: seg.arrival.iataCode,
                    departure: seg.departure.at,
                    arrival: seg.arrival.at,
                    durationMinutes: parseDurationToMinutes(seg.duration),
                    cabin,
                    bookingClass: fareDetail?.class,
                    seatsAvailable: offer.numberOfBookableSeats,
                    stops: seg.numberOfStops ?? 0,
                };
            });

            const firstSeg = segments[0];
            const lastSeg = segments[segments.length - 1] ?? firstSeg;

            return {
                legIndex,
                origin: firstSeg?.origin ?? "",
                destination: lastSeg?.destination ?? "",
                departure: firstSeg?.departure ?? "",
                arrival: lastSeg?.arrival ?? "",
                durationMinutes: parseDurationToMinutes(itin.duration),
                stops: segments.length - 1,
                segments,
            };
        });

        // Per-passenger fare breakdown
        const travelerTypeMap: Record<string, "ADT" | "CNN" | "INF"> = {
            ADULT: "ADT",
            CHILD: "CNN",
            HELD_INFANT: "INF",
        };

        const passengerFares: PassengerFare[] = (offer.travelerPricings ?? []).map(
            (tp) => {
                const bags = tp.fareDetailsBySegment?.[0]?.includedCheckedBags;
                const baggage: BaggageAllowance | undefined = bags
                    ? {
                        pieces: bags.quantity,
                        weight: bags.weight,
                        unit: bags.weightUnit?.toLowerCase() as "kg" | "lb" | undefined,
                    }
                    : undefined;

                const base = parseFloat(tp.price?.base ?? "0");
                const total = parseFloat(tp.price?.total ?? "0");

                return {
                    passengerType: travelerTypeMap[tp.travelerType] ?? "ADT",
                    quantity: 1,
                    baseFare: base,
                    taxes: total - base,
                    totalFare: total,
                    currency: tp.price?.currency ?? currency,
                    baggage,
                };
            },
        );

        const firstLeg = legs[0];
        const firstSegment = firstLeg?.segments[0];
        if (!firstLeg || !firstSegment) continue;

        offers.push({
            id: offer.id ?? `amadeus-${offers.length + 1}`,
            provider: "Amadeus",
            airline: firstSegment.airline,
            flightNumber: firstSegment.flightNumber,
            origin: firstLeg.origin,
            destination: firstLeg.destination,
            departure: firstLeg.departure,
            arrival: firstLeg.arrival,
            durationMinutes: firstLeg.durationMinutes,
            stops: firstLeg.stops,
            cabin: firstSegment.cabin,
            price: grandTotal,
            currency,
            passengerFares: passengerFares.length > 0 ? passengerFares : undefined,
            legs,
            validatingAirline: offer.validatingAirlineCodes?.[0],
            seatsAvailable: offer.numberOfBookableSeats,
        });
    }

    return offers;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function searchAmadeusFlights(
    query: FlightSearchQuery,
): Promise<FlightOffer[]> {
    const env = getAmadeusEnv();
    if (!env) return [];

    const token = await getAmadeusAccessToken();
    const payload = buildAmadeusSearchPayload(query, env);

    const response = await fetch(`${env.baseUrl}${AMADEUS_SHOP_PATH}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `Amadeus flight search failed (${response.status}): ${text.slice(0, 220)}`,
        );
    }

    const data = (await response.json()) as unknown;
    return mapAmadeusResponseToOffers(data);
}
