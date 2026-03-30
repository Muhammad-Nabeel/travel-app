import data from "@/lib/data/aviation-reference.json";

type AirportRef = {
    iata: string;
    city: string;
    country: string;
    airportName: string;
};

type AirlineRef = {
    code: string;
    name: string;
};

const airportByCode = new Map<string, AirportRef>(
    data.airports.map((a) => [a.iata.trim().toUpperCase(), a]),
);

const airlineByCode = new Map<string, AirlineRef>(
    data.airlines.map((a) => [a.code.toUpperCase(), a]),
);

export function getAirportRef(iataCode?: string) {
    if (!iataCode) return null;
    const normalized = iataCode.trim().toUpperCase().slice(0, 3);
    if (!normalized) return null;
    return airportByCode.get(normalized) ?? null;
}

export function getAirportDisplay(iataCode?: string) {
    const ref = getAirportRef(iataCode);
    if (!ref) return null;
    return {
        code: ref.iata,
        city: ref.city,
        airportName: ref.airportName,
        full: `${ref.city} - ${ref.airportName}`,
    };
}

export function getAirlineName(codeOrName?: string) {
    if (!codeOrName) return null;
    const cleaned = codeOrName.trim().toUpperCase();
    if (cleaned.length === 2 && airlineByCode.has(cleaned)) {
        return airlineByCode.get(cleaned)!.name;
    }
    return null;
}
