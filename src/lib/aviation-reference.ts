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

type IndexedAirport = {
    iata: string;
    normalizedCity: string;
    normalizedCountry: string;
    normalizedAirportName: string;
    result: AirportSearchResult;
};

export type CitySearchResult = {
    city: string;
    country: string;
    iata: string;
};

const airports = data.airports;
const AIRPORT_PREFIX_INDEX_MAX_LENGTH = 12;
const AIRPORT_SEARCH_CACHE_MAX_SIZE = 200;

const indexedAirports: IndexedAirport[] = airports.map((airport) => {
    const iata = airport.iata.trim().toUpperCase();
    const city = airport.city.trim();
    const airportName = airport.airportName.trim();
    const country = airport.country.trim();

    return {
        iata,
        normalizedCity: city.toUpperCase(),
        normalizedCountry: country.toUpperCase(),
        normalizedAirportName: airportName.toUpperCase(),
        result: {
            iata,
            city,
            country,
            name: airportName,
        },
    };
});

const airportPrefixIndex = new Map<string, number[]>();
const airportSearchCache = new Map<string, AirportSearchResult[]>();

function addAirportPrefix(prefix: string, airportIndex: number) {
    if (prefix.length < 2) {
        return;
    }

    const existing = airportPrefixIndex.get(prefix);
    if (existing) {
        if (existing[existing.length - 1] !== airportIndex) {
            existing.push(airportIndex);
        }
        return;
    }

    airportPrefixIndex.set(prefix, [airportIndex]);
}

function indexAirportValue(value: string, airportIndex: number) {
    const source = value.trim().toUpperCase();
    if (!source) {
        return;
    }

    const seenPrefixes = new Set<string>();
    const tokens = source
        .split(/[\s,./()\-]+/)
        .filter(Boolean);

    // Include the full source so prefixes that span words still resolve quickly.
    tokens.push(source);

    for (const token of tokens) {
        const maxLen = Math.min(token.length, AIRPORT_PREFIX_INDEX_MAX_LENGTH);
        for (let len = 2; len <= maxLen; len += 1) {
            const prefix = token.slice(0, len);
            if (seenPrefixes.has(prefix)) {
                continue;
            }
            seenPrefixes.add(prefix);
            addAirportPrefix(prefix, airportIndex);
        }
    }
}

function scoreIndexedAirport(
    airport: IndexedAirport,
    normalizedQuery: string,
): number {
    if (airport.iata === normalizedQuery) {
        return 500;
    }
    if (airport.normalizedCity === normalizedQuery) {
        return 400;
    }
    if (airport.normalizedAirportName === normalizedQuery) {
        return 350;
    }
    if (airport.normalizedCity.startsWith(normalizedQuery)) {
        return 300;
    }
    if (airport.normalizedAirportName.startsWith(normalizedQuery)) {
        return 250;
    }
    if (airport.normalizedCountry === normalizedQuery) {
        return 200;
    }
    if (
        airport.normalizedCity.includes(normalizedQuery) ||
        airport.normalizedAirportName.includes(normalizedQuery) ||
        airport.normalizedCountry.includes(normalizedQuery)
    ) {
        return 100;
    }

    return -1;
}

function setAirportSearchCache(
    key: string,
    value: AirportSearchResult[],
): AirportSearchResult[] {
    if (airportSearchCache.size >= AIRPORT_SEARCH_CACHE_MAX_SIZE) {
        const oldestKey = airportSearchCache.keys().next().value;
        if (oldestKey) {
            airportSearchCache.delete(oldestKey);
        }
    }

    airportSearchCache.set(key, value);
    return value;
}

for (let index = 0; index < indexedAirports.length; index += 1) {
    const airport = indexedAirports[index];
    indexAirportValue(airport.iata, index);
    indexAirportValue(airport.normalizedCity, index);
    indexAirportValue(airport.normalizedAirportName, index);
    indexAirportValue(airport.normalizedCountry, index);
}

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

    const cached = airportSearchCache.get(normalized);
    if (cached) {
        return cached.slice(0, limit);
    }

    const indexedCandidates = airportPrefixIndex.get(normalized);
    const candidateIndexes = indexedCandidates
        ? Array.from(new Set(indexedCandidates))
        : indexedAirports.map((_, index) => index);

    const scored = candidateIndexes
        .map((index) => {
            const airport = indexedAirports[index];
            return {
                score: scoreIndexedAirport(airport, normalized),
                result: airport.result,
            };
        })
        .filter((entry) => entry.score >= 0)

    const scoredCandidates =
        scored.length > 0
            ? scored
            : indexedAirports
                .map((airport) => ({
                    score: scoreIndexedAirport(airport, normalized),
                    result: airport.result,
                }))
                .filter((entry) => entry.score >= 0);

    const results = scoredCandidates
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

    return setAirportSearchCache(normalized, results);
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
