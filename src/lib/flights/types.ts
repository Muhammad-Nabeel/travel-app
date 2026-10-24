export type TripType = "one-way" | "round-trip" | "multi-city";

export type CabinClass =
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First";

export type MultiCityLeg = {
    origin: string;
    destination: string;
    departureDate: string;
};

export type FlightSearchQuery = {
    tripType: TripType;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    legs?: MultiCityLeg[];
    adults: number;
    children: number;
    infants: number;
    cabinClass: CabinClass;
    currency: string;
    directOnly: boolean;
};

// ── Unified flight offer shape (Sabre + Amadeus + Mock) ──────────────────────

/** A single flight segment (one take-off / one landing). */
export type FlightSegment = {
    segmentIndex: number;
    /** IATA marketing carrier code e.g. "EK" */
    airline: string;
    /** IATA operating carrier when different from marketing (codeshare) */
    operatingAirline?: string;
    /** e.g. "EK621" */
    flightNumber: string;
    /** Aircraft type code e.g. "77W" */
    aircraft?: string;
    /** IATA departure airport code */
    origin: string;
    /** IATA arrival airport code */
    destination: string;
    /** ISO 8601 datetime */
    departure: string;
    /** ISO 8601 datetime */
    arrival: string;
    durationMinutes?: number;
    cabin: CabinClass;
    /** Booking class code e.g. "Y" */
    bookingClass?: string;
    seatsAvailable?: number;
    /** Number of technical stops within this segment */
    stops: number;
};

/** One leg of the journey (outbound or return). May contain multiple segments. */
export type FlightLeg = {
    /** 0 = outbound, 1 = return */
    legIndex: number;
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    durationMinutes?: number;
    /** Number of connecting stops */
    stops: number;
    segments: FlightSegment[];
};

export type BaggageAllowance = {
    pieces?: number;
    weight?: number;
    unit?: "kg" | "lb";
};

export type PassengerFare = {
    passengerType: "ADT" | "CNN" | "INF";
    quantity: number;
    baseFare: number;
    taxes: number;
    totalFare: number;
    currency: string;
    baggage?: BaggageAllowance;
};

/**
 * Normalized flight offer — provider-agnostic shape consumed by the frontend.
 * Top-level convenience fields are derived from the first outbound leg / segment
 * for easy display; full structured data lives in `legs`.
 */
export type FlightOffer = {
    id: string;
    provider: "Sabre" | "Amadeus" | "Mock";
    // ── Convenience (first outbound leg / first segment) ──
    airline: string;
    flightNumber?: string;
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    durationMinutes?: number;
    stops: number;
    cabin: CabinClass;
    // ── Pricing ──
    price: number;
    currency: string;
    passengerFares?: PassengerFare[];
    // ── Full structured itinerary ──
    legs?: FlightLeg[];
    // ── Meta ──
    validatingAirline?: string;
    refundable?: boolean;
    seatsAvailable?: number;
};

export type FlightSearchSuccessResult = {
    ok: true;
    query: FlightSearchQuery;
    results: FlightOffer[];
    source: "sabre" | "amadeus" | "mock";
    warnings: string[];
};

export type FlightSearchErrorResult = {
    ok: false;
    errors: {
        formErrors: string[];
        fieldErrors: Record<string, string[] | undefined>;
    };
};

export type FlightSearchResult =
    | FlightSearchSuccessResult
    | FlightSearchErrorResult;
