import { NextRequest, NextResponse } from "next/server";

type RawAirport = {
  iata?: string;
  city?: string;
  country?: string;
  name?: string;
};

type AirportResult = {
  iata: string;
  city: string;
  country: string;
  name: string;
};

const PUBLIC_AIRPORTS_URL =
  "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json";

let cachedAirports: AirportResult[] | null = null;

async function loadAirportIndex() {
  if (cachedAirports) {
    return cachedAirports;
  }

  const response = await fetch(PUBLIC_AIRPORTS_URL, {
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch airport index");
  }

  const payload = (await response.json()) as Record<string, RawAirport>;
  const airportMap = new Map<string, AirportResult>();

  for (const entry of Object.values(payload)) {
    const iata = entry.iata?.trim().toUpperCase();
    const city = entry.city?.trim();

    if (!iata || iata.length !== 3 || !city) {
      continue;
    }

    if (!airportMap.has(iata)) {
      airportMap.set(iata, {
        iata,
        city,
        country: entry.country?.trim() || "Unknown",
        name: entry.name?.trim() || `${city} Airport`,
      });
    }
  }

  cachedAirports = Array.from(airportMap.values());
  return cachedAirports;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim().toLowerCase() || "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const airports = await loadAirportIndex();
    const results = airports
      .filter((airport) => {
        const searchable = `${airport.city} ${airport.name} ${airport.iata} ${airport.country}`.toLowerCase();
        return searchable.includes(query);
      })
      .sort((left, right) => {
        const leftStarts = left.city.toLowerCase().startsWith(query) ? 1 : 0;
        const rightStarts = right.city.toLowerCase().startsWith(query) ? 1 : 0;
        return rightStarts - leftStarts;
      })
      .slice(0, 8);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { results: [], error: "Airport service temporarily unavailable" },
      { status: 503 },
    );
  }
}