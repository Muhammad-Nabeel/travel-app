import "server-only";

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

export type AirlineOption = {
    code: string;
    name: string;
};

export type AirportOption = {
    iata: string;
    city: string;
    country: string;
    airportName: string;
};

type AirportSearchResult = {
    iata: string;
    city: string;
    country: string;
    name: string;
};

export type CitySearchResult = {
    city: string;
    country: string;
    iata: string;
};

const airports = data.airports;

const cityReferenceMap = new Map<string, CitySearchResult>();

for (const airport of airports) {
    const city = airport.city.trim();
    const country = airport.country.trim();
    const iata = airport.iata.trim().toUpperCase();
    if (!city || !country || !iata) {
        continue;
    }

    const key = `${city.toUpperCase()}|${country.toUpperCase()}`;
    if (!cityReferenceMap.has(key)) {
        cityReferenceMap.set(key, { city, country, iata });
    }
}

const cityReferences = Array.from(cityReferenceMap.values());

const airportByCode = new Map<string, AirportRef>(
    airports.map((a) => [a.iata.trim().toUpperCase(), a]),
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

export function listAirlineOptions(limit = 300): AirlineOption[] {
    return data.airlines
        .map((airline) => ({
            code: airline.code.trim().toUpperCase(),
            name: airline.name.trim(),
        }))
        .filter((airline) => airline.code.length >= 2 && airline.name.length > 0)
        .sort((left, right) => left.name.localeCompare(right.name))
        .slice(0, limit);
}

export function listAirportOptions(limit = 300): AirportOption[] {
    return airports
        .map((airport) => ({
            iata: airport.iata.trim().toUpperCase(),
            city: airport.city.trim(),
            country: airport.country.trim(),
            airportName: airport.airportName.trim(),
        }))
        .filter((airport) => airport.iata.length === 3)
        .sort((left, right) => {
            const cityCompare = left.city.localeCompare(right.city);
            if (cityCompare !== 0) {
                return cityCompare;
            }
            return left.iata.localeCompare(right.iata);
        })
        .slice(0, limit);
}

function normalizeAirportSearchValue(value?: string) {
    return value?.trim().toUpperCase() ?? "";
}

export function searchAirports(query?: string, limit = 8): AirportSearchResult[] {
    const normalized = normalizeAirportSearchValue(query);

    if (normalized.length < 2) {
        return [];
    }

    return airports
        .map((airport) => {
            const iata = airport.iata.trim().toUpperCase();
            const city = airport.city.trim();
            const airportName = airport.airportName.trim();
            const country = airport.country.trim();
            const normalizedCity = city.toUpperCase();
            const normalizedAirportName = airportName.toUpperCase();
            const normalizedCountry = country.toUpperCase();

            let score = -1;

            if (iata === normalized) {
                score = 500;
            } else if (normalizedCity === normalized) {
                score = 400;
            } else if (normalizedAirportName === normalized) {
                score = 350;
            } else if (normalizedCity.startsWith(normalized)) {
                score = 300;
            } else if (normalizedAirportName.startsWith(normalized)) {
                score = 250;
            } else if (normalizedCountry === normalized) {
                score = 200;
            } else if (
                normalizedCity.includes(normalized) ||
                normalizedAirportName.includes(normalized) ||
                normalizedCountry.includes(normalized)
            ) {
                score = 100;
            }

            return {
                score,
                result: {
                    iata,
                    city,
                    country,
                    name: airportName,
                },
            };
        })
        .filter((entry) => entry.score >= 0)
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            const cityCompare = left.result.city.localeCompare(right.result.city);
            if (cityCompare !== 0) {
                return cityCompare;
            }

            return left.result.iata.localeCompare(right.result.iata);
        })
        .slice(0, limit)
        .map((entry) => entry.result);
}

function normalizeCitySearchValue(value?: string) {
    return value?.trim().toUpperCase() ?? "";
}

export function searchCities(query?: string, limit = 10): CitySearchResult[] {
    const normalized = normalizeCitySearchValue(query);

    if (normalized.length < 2) {
        return [];
    }

    return cityReferences
        .map((entry) => {
            const normalizedCity = entry.city.toUpperCase();
            const normalizedCountry = entry.country.toUpperCase();

            let score = -1;

            if (normalizedCity === normalized) {
                score = 500;
            } else if (normalizedCountry === normalized) {
                score = 400;
            } else if (normalizedCity.startsWith(normalized)) {
                score = 300;
            } else if (normalizedCountry.startsWith(normalized)) {
                score = 250;
            } else if (
                normalizedCity.includes(normalized) ||
                normalizedCountry.includes(normalized)
            ) {
                score = 100;
            }

            return {
                score,
                result: entry,
            };
        })
        .filter((entry) => entry.score >= 0)
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            const cityCompare = left.result.city.localeCompare(right.result.city);
            if (cityCompare !== 0) {
                return cityCompare;
            }

            return left.result.country.localeCompare(right.result.country);
        })
        .slice(0, limit)
        .map((entry) => entry.result);
}
