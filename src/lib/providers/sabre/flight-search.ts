import { Buffer } from "node:buffer";

import type {
    BaggageAllowance,
    CabinClass,
    FlightLeg,
    FlightOffer,
    FlightSearchQuery,
    FlightSegment,
    PassengerFare,
} from "@/lib/flights/types";

const SABRE_AUTH_PATH = "/v2/auth/token";
const DEFAULT_SHOP_PATH = "/v5/offers/shop";
const DEFAULT_FARE_CALENDAR_PATH = "/v6.1.0/shop/altdates/flights?mode=live";
const TOKEN_BUFFER_MS = 20_000;
const DEFAULT_VENDOR_CODES = [
    "AZ",
    "CX",
    "CZ",
    "EK",
    "EY",
    "GF",
    "KL",
    "KU",
    "LX",
    "PK",
    "QR",
    "SV",
    "TG",
    "TK",
    "UL",
    "6S",
    "YO",
    "FZ",
    "HY",
    "LH",
    "WY",
    "PC",
    "VS",
    "KQ",
    "AC",
    "AF",
    "SQ",
    "DV",
    "GP",
    "ET",
    "DL",
    "AT",
    "J2",
    "PF",
    "HR",
    "MS",
    "ER",
    "SZ",
    "XY",
    "PR",
    "OD",
    "RJ",
] as const;

type SabreTokenCache = {
    token: string;
    expiresAt: number;
};

let cachedToken: SabreTokenCache | null = null;

function getSabreEnv() {
    const baseUrl = process.env.SABRE_BASE_URL?.trim();
    const clientId = process.env.SABRE_CLIENT_ID?.trim();
    const clientSecret = process.env.SABRE_CLIENT_SECRET?.trim();
    const cpaId = process.env.SABRE_CPA_ID?.trim() || clientId;
    const pseudoCityCode =
        process.env.SABRE_PCC?.trim() || clientId?.split(":")?.[2] || "";
    const requestorCompanyCode =
        process.env.SABRE_REQUESTOR_COMPANY_CODE?.trim() || "TN";
    const isoCountry = process.env.SABRE_ISO_COUNTRY?.trim() || "PK";
    const isoCurrency = process.env.SABRE_ISO_CURRENCY?.trim() || "PKR";
    const includeVendorCodes =
        process.env.SABRE_INCLUDE_VENDOR_CODES?.split(",")
            .map((code) => code.trim().toUpperCase())
            .filter(Boolean) || [...DEFAULT_VENDOR_CODES];

    if (!baseUrl || !clientId || !clientSecret) {
        return null;
    }

    return {
        baseUrl,
        clientId,
        clientSecret,
        cpaId,
        pseudoCityCode,
        requestorCompanyCode,
        isoCountry,
        isoCurrency,
        includeVendorCodes,
    };
}

async function requestWithTimeout(
    input: string,
    init: RequestInit,
    timeoutMs = 10_000,
) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

async function getSabreAccessToken() {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt - TOKEN_BUFFER_MS > now) {
        return cachedToken.token;
    }

    const env = getSabreEnv();
    if (!env) {
        throw new Error("Sabre credentials are missing in environment variables.");
    }

    const nestedBasicToken = Buffer.from(
        `${Buffer.from(env.clientId).toString("base64")}:${Buffer.from(env.clientSecret).toString("base64")}`,
    ).toString("base64");

    const response = await requestWithTimeout(`${env.baseUrl}${SABRE_AUTH_PATH}`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${nestedBasicToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    });

    if (!response.ok) {
        const failureText = await response.text();
        throw new Error(
            `Sabre token request failed (${response.status}) using nested token: ${failureText.slice(0, 220)}`,
        );
    }

    const payload = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
    };

    if (!payload.access_token) {
        throw new Error("Sabre token response did not include an access_token.");
    }
    cachedToken = {
        token: payload.access_token,
        expiresAt: now + (payload.expires_in ?? 300) * 1000,
    };

    return payload.access_token;
}

function mapCabinClass(cabinClass: FlightSearchQuery["cabinClass"]) {
    switch (cabinClass) {
        case "Premium Economy":
            return "S";
        case "Business":
            return "C";
        case "First":
            return "P";
        default:
            return "Y";
    }
}

function buildSabreSearchCorePayload(
    query: FlightSearchQuery,
    env: NonNullable<ReturnType<typeof getSabreEnv>>,
) {
    const passengers = [
        { code: "ADT", quantity: query.adults },
        { code: "CNN", quantity: query.children },
        { code: "INF", quantity: query.infants },
    ].filter((pax) => pax.quantity > 0);

    const includeVendorPref = Array.from(new Set(env.includeVendorCodes)).map(
        (code) => ({ Code: code }),
    );

    const buildOriginDestinationSegment = (params: {
        origin: string;
        destination: string;
        departureDate: string;
        rph: string;
    }) => ({
        DepartureDateTime: `${params.departureDate}T00:00:00`,
        DepartureWindow: "00002359",
        DestinationLocation: { LocationCode: params.destination },
        OriginLocation: { LocationCode: params.origin },
        RPH: params.rph,
        TPA_Extensions: {
            CabinPref: {
                Cabin: mapCabinClass(query.cabinClass),
                PreferLevel: "Only",
            },
            SegmentType: {
                Code: "O",
            },
            IncludeVendorPref: includeVendorPref,
        },
    });

    const originDestinationInformation =
        query.tripType === "multi-city" && (query.legs?.length ?? 0) > 0
            ? (query.legs ?? []).slice(0, 6).map((leg, index) =>
                buildOriginDestinationSegment({
                    origin: leg.origin,
                    destination: leg.destination,
                    departureDate: leg.departureDate,
                    rph: String(index + 1),
                }),
            )
            : [
                buildOriginDestinationSegment({
                    origin: query.origin,
                    destination: query.destination,
                    departureDate: query.departureDate,
                    rph: "1",
                }),
                ...(query.tripType === "round-trip" && query.returnDate
                    ? [
                        buildOriginDestinationSegment({
                            origin: query.destination,
                            destination: query.origin,
                            departureDate: query.returnDate,
                            rph: "2",
                        }),
                    ]
                    : []),
            ];

    return {
        AvailableFlightsOnly: true,
        ResponseType: "OTA",
        OriginDestinationInformation: originDestinationInformation,
        POS: {
            Source: [
                {
                    PseudoCityCode: env.pseudoCityCode,
                    RequestorID: {
                        CompanyName: {
                            Code: env.requestorCompanyCode,
                        },
                        ID: "1",
                        Type: "1",
                    },
                    ISOCountry: env.isoCountry,
                    ISOCurrency: env.isoCurrency,
                },
            ],
        },
        TPA_Extensions: {
            IntelliSellTransaction: {
                RequestType: {
                    Name: "200ITINS",
                },
            },
            RichContent: {
                FlightAmenities: true,
                SeatInfo: true,
                UniversalProductAttributes: true,
                UniversalTicketingAttributes: true,
            },
        },
        TravelPreferences: {
            ETicketDesired: true,
            ValidInterlineTicket: true,
            MaxStopsQuantity: query.directOnly ? 0 : 2,
            AncillaryFees: {
                Enable: true,
                Summary: true,
                AncillaryFeeGroup: [
                    { Code: "BG" },
                    { Code: "IE" },
                    { Code: "ML" },
                    { Code: "SA" },
                    { Code: "UN" },
                ],
            },
            TPA_Extensions: {
                DataSources: {
                    ATPCO: "Enable",
                    LCC: "Enable",
                    // NDC requires IATA NDC certification on the Sabre account.
                    // Set SABRE_NDC_ENABLED=true in env to turn it on.
                    NDC: process.env.SABRE_NDC_ENABLED === "true" ? "Enable" : "Disable",
                },
                OnlineIndicator: {
                    Ind: false,
                },
                TripType: {
                    Value:
                        query.tripType === "round-trip"
                            ? "Return"
                            : "OneWay",
                },
            },
        },
        TravelerInfoSummary: {
            AirTravelerAvail: [
                {
                    PassengerTypeQuantity: passengers.map((pax) => ({
                        Code: pax.code,
                        Quantity: pax.quantity,
                    })),
                },
            ],
            PriceRequestInformation: {
                CurrencyCode: env.isoCurrency,
                NegotiatedFaresOnly: false,
                ProcessThruFaresOnly: true,
                TPA_Extensions: {
                    Priority: {
                        Price: {
                            Priority: 1,
                        },
                        DirectFlights: {
                            Priority: 2,
                        },
                        Time: {
                            Priority: 3,
                        },
                        Vendor: {
                            Priority: 4,
                        },
                    },
                },
            },
            SpecificPTC_Indicator: true,
            SeatsRequested: [query.adults + query.children + query.infants],
        },
    };
}

function buildSabreSearchPayload(
    query: FlightSearchQuery,
    env: NonNullable<ReturnType<typeof getSabreEnv>>,
) {
    const core = buildSabreSearchCorePayload(query, env);

    return {
        OTA_AirLowFareSearchRQ: {
            ...core,
            Version: "5",
        },
    };
}

// ── Sabre groupedItineraryResponse types ─────────────────────────────────────

type SabreScheduleDesc = {
    id: number;
    departure?: { airport?: string; time?: string };
    arrival?: { airport?: string; time?: string };
    carrier?: {
        marketing?: string;
        marketingFlightNumber?: number;
        operating?: string;
        equipment?: { code?: string };
    };
    elapsedTime?: number;
    stops?: number;
};

type SabreLegDesc = {
    id: number;
    elapsedTime?: number;
    schedules: Array<{ ref: number; departureDateAdjustment?: number }>;
};

type SabreBaggageAllowanceDesc = {
    id: number;
    pieceCount?: number;
    weight?: number;
    unit?: string;
};

type SabrePassengerInfo = {
    passengerType?: string;
    passengerNumber?: number;
    passengerTotalFare?: {
        totalFare?: number;
        baseFare?: number;
        taxes?: number;
        currency?: string;
    };
    baggageInformation?: Array<{ allowance?: { ref?: number } }>;
    fareComponents?: Array<{
        segments?: Array<{
            segment?: { bookingCode?: string; seatsAvailable?: number; cabin?: string };
        }>;
    }>;
};

type SabreItineraryGroup = {
    groupDescription?: {
        legDescriptions?: Array<{
            departureDate?: string;
            departureLocation?: string;
            arrivalLocation?: string;
        }>;
    };
    itineraries?: Array<{
        legs?: Array<{ ref: number }>;
        pricingInformation?: Array<{
            fare?: {
                totalFare?: { totalPrice?: number; currency?: string };
                passengerInfoList?: Array<{ passengerInfo?: SabrePassengerInfo }>;
            };
        }>;
    }>;
};

type SabreGroupedItineraryResponse = {
    statistics?: { itineraryCount?: number };
    legDescs?: SabreLegDesc[];
    scheduleDescs?: SabreScheduleDesc[];
    baggageAllowanceDescs?: SabreBaggageAllowanceDesc[];
    itineraryGroups?: SabreItineraryGroup[];
};

// ── Cabin code helper ───────────────────────────────────────────────────────

function mapSabreCabinCode(cabin: string | undefined): CabinClass {
    switch (cabin?.toUpperCase()) {
        case "C":
        case "J":
            return "Business";
        case "F":
        case "P":
            return "First";
        case "S":
        case "W":
            return "Premium Economy";
        default:
            return "Economy";
    }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
    const [h = "0", m = "0"] = time.split(":");
    return parseInt(h) * 60 + parseInt(m);
}

function addDays(dateStr: string, days: number): string {
    if (!days) return dateStr;
    const d = new Date(dateStr);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

// ── Sabre response → FlightOffer[] ───────────────────────────────────────────

function mapSabreResponseToOffers(data: unknown): FlightOffer[] {
    if (!data || typeof data !== "object") return [];

    const root = data as { groupedItineraryResponse?: SabreGroupedItineraryResponse };
    const gir = root.groupedItineraryResponse;
    if (!gir || (gir.statistics?.itineraryCount ?? 0) === 0) return [];

    // Build lookup maps for O(1) ref dereferencing
    const legDescMap = new Map<number, SabreLegDesc>(
        (gir.legDescs ?? []).map((l) => [l.id, l]),
    );
    const scheduleDescMap = new Map<number, SabreScheduleDesc>(
        (gir.scheduleDescs ?? []).map((s) => [s.id, s]),
    );
    const baggageDescMap = new Map<number, SabreBaggageAllowanceDesc>(
        (gir.baggageAllowanceDescs ?? []).map((b) => [b.id, b]),
    );

    const offers: FlightOffer[] = [];

    for (const group of gir.itineraryGroups ?? []) {
        const legDescriptions = group.groupDescription?.legDescriptions ?? [];

        for (const itinerary of group.itineraries ?? []) {
            const pricing = itinerary.pricingInformation?.[0];
            const totalPrice = pricing?.fare?.totalFare?.totalPrice;
            if (!totalPrice) continue;

            const price = Number(totalPrice);
            if (Number.isNaN(price) || price <= 0) continue;

            const currency = pricing.fare?.totalFare?.currency ?? "PKR";

            // Flatten all booking codes / seat counts across fare components
            const passengerInfo0 = pricing.fare?.passengerInfoList?.[0]?.passengerInfo;
            const allFareSegments =
                passengerInfo0?.fareComponents?.flatMap((fc) => fc.segments ?? []) ?? [];

            const legs: FlightLeg[] = [];

            (itinerary.legs ?? []).forEach((legRef, legIndex) => {
                const legDesc = legDescMap.get(legRef.ref);
                if (!legDesc) return;

                const legDate = legDescriptions[legIndex]?.departureDate ?? "";
                const segments: FlightSegment[] = [];

                legDesc.schedules.forEach((schedRef, segIndex) => {
                    const sched = scheduleDescMap.get(schedRef.ref);
                    if (!sched) return;

                    const depTime = sched.departure?.time ?? "00:00:00";
                    const arrTime = sched.arrival?.time ?? "00:00:00";

                    const depDayOffset = schedRef.departureDateAdjustment ?? 0;
                    const depDate = legDate ? addDays(legDate, depDayOffset) : legDate;
                    const arrDayOffset =
                        depDayOffset + (timeToMinutes(arrTime) < timeToMinutes(depTime) ? 1 : 0);
                    const arrDate = legDate ? addDays(legDate, arrDayOffset) : legDate;

                    const depDatetime = depDate ? `${depDate}T${depTime}` : depTime;
                    const arrDatetime = arrDate ? `${arrDate}T${arrTime}` : arrTime;

                    const airline = sched.carrier?.marketing ?? "";
                    const flightNumber = sched.carrier?.marketingFlightNumber
                        ? `${airline}${sched.carrier.marketingFlightNumber}`
                        : airline;
                    const operatingAirline =
                        sched.carrier?.operating && sched.carrier.operating !== airline
                            ? sched.carrier.operating
                            : undefined;

                    const fareSegment = allFareSegments[segIndex]?.segment;

                    segments.push({
                        segmentIndex: segIndex,
                        airline,
                        operatingAirline,
                        flightNumber,
                        aircraft: sched.carrier?.equipment?.code,
                        origin: sched.departure?.airport ?? "",
                        destination: sched.arrival?.airport ?? "",
                        departure: depDatetime,
                        arrival: arrDatetime,
                        durationMinutes: sched.elapsedTime,
                        cabin: mapSabreCabinCode(fareSegment?.cabin),
                        bookingClass: fareSegment?.bookingCode,
                        seatsAvailable: fareSegment?.seatsAvailable,
                        stops: sched.stops ?? 0,
                    });
                });

                if (segments.length === 0) return;

                const firstSeg = segments[0];
                const lastSeg = segments[segments.length - 1];

                legs.push({
                    legIndex,
                    origin: firstSeg.origin,
                    destination: lastSeg.destination,
                    departure: firstSeg.departure,
                    arrival: lastSeg.arrival,
                    durationMinutes: legDesc.elapsedTime,
                    stops: segments.length - 1,
                    segments,
                });
            });

            if (legs.length === 0) continue;

            // Build per-passenger fare breakdown
            const passengerFares: PassengerFare[] = (
                pricing.fare?.passengerInfoList ?? []
            ).map((pil) => {
                const pi = pil.passengerInfo;
                const bagRef = pi?.baggageInformation?.[0]?.allowance?.ref;
                const bagDesc = bagRef != null ? baggageDescMap.get(bagRef) : undefined;
                const baggage: BaggageAllowance | undefined = bagDesc
                    ? {
                        pieces: bagDesc.pieceCount,
                        weight: bagDesc.weight,
                        unit: bagDesc.unit as "kg" | "lb" | undefined,
                    }
                    : undefined;

                return {
                    passengerType: (pi?.passengerType ?? "ADT") as "ADT" | "CNN" | "INF",
                    quantity: pi?.passengerNumber ?? 1,
                    baseFare: pi?.passengerTotalFare?.baseFare ?? 0,
                    taxes: pi?.passengerTotalFare?.taxes ?? 0,
                    totalFare: pi?.passengerTotalFare?.totalFare ?? price,
                    currency,
                    baggage,
                };
            });

            const firstLeg = legs[0];
            const firstSegment = firstLeg.segments[0];

            offers.push({
                id: `sabre-${offers.length + 1}`,
                provider: "Sabre",
                airline: firstSegment.airline,
                flightNumber: firstSegment.flightNumber,
                origin: firstLeg.origin,
                destination: firstLeg.destination,
                departure: firstLeg.departure,
                arrival: firstLeg.arrival,
                durationMinutes: firstLeg.durationMinutes,
                stops: firstLeg.stops,
                cabin: firstSegment.cabin,
                price,
                currency,
                passengerFares: passengerFares.length > 0 ? passengerFares : undefined,
                legs,
                validatingAirline: firstSegment.airline,
                seatsAvailable: firstSegment.seatsAvailable,
            });
        }
    }

    return offers;
}

export async function searchSabreFlights(
    query: FlightSearchQuery,
): Promise<FlightOffer[]> {
    const env = getSabreEnv();
    if (!env) {
        return [];
    }

    const token = await getSabreAccessToken();

    const endpointPath =
        process.env.SABRE_FLIGHT_SEARCH_PATH?.trim() || DEFAULT_SHOP_PATH;
    const payload = buildSabreSearchPayload(query, env);

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (env.cpaId) {
        headers["X-CPAID"] = env.cpaId;
    }

    const response = await requestWithTimeout(`${env.baseUrl}${endpointPath}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const failureText = await response.text();
        throw new Error(
            `Sabre flight search failed (${response.status}) using OTA v5 payload: ${failureText.slice(0, 220)}`,
        );
    }

    const responsePayload = (await response.json()) as unknown;
    return mapSabreResponseToOffers(responsePayload);
}

export type FareCalendarEntry = {
    date: string;
    amount: number;
    currency: string;
};

function toIsoDate(value: string | undefined) {
    if (!value) return "";
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : "";
}

function addDaysToIsoDate(isoDate: string, days: number) {
    const parsed = Date.parse(`${isoDate}T00:00:00.000Z`);
    if (!Number.isFinite(parsed)) {
        return isoDate;
    }
    const result = new Date(parsed);
    result.setUTCDate(result.getUTCDate() + days);
    return result.toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : NaN;
    }
    return NaN;
}

function mapSabreFareCalendarResponse(payload: unknown): FareCalendarEntry[] {
    if (!payload || typeof payload !== "object") {
        return [];
    }

    const root = payload as {
        groupedItineraryResponse?: {
            itineraryGroups?: Array<{
                groupDescription?: {
                    legDescriptions?: Array<{
                        departureDate?: string;
                        departureDateTime?: string;
                    }>;
                };
                itineraries?: Array<{
                    pricingInformation?: Array<{
                        fare?: {
                            totalFare?: {
                                totalPrice?: number | string;
                                currency?: string;
                            };
                        };
                    }>;
                }>;
            }>;
        };
    };

    const itineraryGroups = root.groupedItineraryResponse?.itineraryGroups ?? [];

    const reduced = new Map<string, FareCalendarEntry>();

    for (const group of itineraryGroups) {
        const leg0 = group.groupDescription?.legDescriptions?.[0];
        const date = toIsoDate(leg0?.departureDate ?? leg0?.departureDateTime);
        if (!date) {
            continue;
        }

        let amount = Number.POSITIVE_INFINITY;
        let currency = "PKR";

        for (const itinerary of group.itineraries ?? []) {
            for (const pricingInfo of itinerary.pricingInformation ?? []) {
                const rawAmount = pricingInfo.fare?.totalFare?.totalPrice;
                const parsedAmount = toNumber(rawAmount);
                if (Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount < amount) {
                    amount = parsedAmount;
                    currency = pricingInfo.fare?.totalFare?.currency ?? currency;
                }
            }
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            continue;
        }

        const existing = reduced.get(date);
        if (!existing || amount < existing.amount) {
            reduced.set(date, {
                date,
                amount,
                currency,
            });
        }
    }

    return Array.from(reduced.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
    );
}

export async function searchSabreFareCalendar(params: {
    origin: string;
    destination: string;
    departureDate: string;
    lengthOfStay?: number;
    cabinClass?: FlightSearchQuery["cabinClass"];
    tripType?: FlightSearchQuery["tripType"];
}): Promise<FareCalendarEntry[]> {
    const env = getSabreEnv();
    if (!env) {
        return [];
    }

    const token = await getSabreAccessToken();
    const endpointPath =
        process.env.SABRE_FARE_CALENDAR_PATH?.trim() || DEFAULT_FARE_CALENDAR_PATH;

    const departureDateTime = `${params.departureDate}T00:00:00`;
    const stayDays = Math.max(1, params.lengthOfStay ?? 7);
    const isRoundTrip = params.tripType === "round-trip";
    const returnDepartureDate = addDaysToIsoDate(params.departureDate, stayDays);

    const payload = {
        OTA_AirLowFareSearchRQ: {
            OriginDestinationInformation: [
                {
                    DepartureDateTime: departureDateTime,
                    OriginLocation: {
                        LocationCode: params.origin,
                    },
                    DestinationLocation: {
                        LocationCode: params.destination,
                    },
                    RPH: "0",
                    ...(params.cabinClass
                        ? {
                            TPA_Extensions: {
                                CabinPref: {
                                    Cabin: mapCabinClass(params.cabinClass),
                                    PreferLevel: "Only",
                                },
                            },
                        }
                        : {}),
                },
                ...(isRoundTrip
                    ? [
                        {
                            DepartureDateTime: `${returnDepartureDate}T00:00:00`,
                            OriginLocation: {
                                LocationCode: params.destination,
                            },
                            DestinationLocation: {
                                LocationCode: params.origin,
                            },
                            RPH: "1",
                            ...(params.cabinClass
                                ? {
                                    TPA_Extensions: {
                                        CabinPref: {
                                            Cabin: mapCabinClass(params.cabinClass),
                                            PreferLevel: "Only",
                                        },
                                    },
                                }
                                : {}),
                        },
                    ]
                    : []),
            ],
            POS: {
                Source: [
                    {
                        PseudoCityCode: env.pseudoCityCode,
                        RequestorID: {
                            CompanyName: {
                                Code: env.requestorCompanyCode,
                            },
                            ID: "1",
                            Type: "1",
                        },
                    },
                ],
            },
            TPA_Extensions: {
                IntelliSellTransaction: {
                    RequestType: {
                        Name: "AD7",
                    },
                },
            },
            TravelPreferences: {
                TPA_Extensions: {
                    DataSources: {
                        ATPCO: "Enable",
                        LCC: "Enable",
                        NDC: "Disable",
                    },
                    NumTrips: {},
                },
            },
            TravelerInfoSummary: {
                AirTravelerAvail: [
                    {
                        PassengerTypeQuantity: [
                            {
                                Code: "ADT",
                                Quantity: 1,
                            },
                        ],
                    },
                ],
                SeatsRequested: [1],
            },
            Version: "1",
        },
    };

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (env.cpaId) {
        headers["X-CPAID"] = env.cpaId;
    }

    const response = await requestWithTimeout(`${env.baseUrl}${endpointPath}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const failureText = await response.text();
        throw new Error(
            `Sabre fare calendar failed (${response.status}): ${failureText.slice(0, 220)}`,
        );
    }

    const responsePayload = (await response.json()) as unknown;
    return mapSabreFareCalendarResponse(responsePayload);
}
