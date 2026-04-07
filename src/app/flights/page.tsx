import type { Metadata } from "next";

import { FareCalendarStrip } from "@/components/features/flights/fare-calendar-strip";
import { FlightsResultsPanel } from "@/components/features/flights/flights-results-panel";
import { MobileSearchToggle } from "@/components/features/flights/mobile-search-toggle";
import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { getAirportDisplay } from "@/lib/aviation-reference";
import { prisma, shouldBypassDatabase } from "@/lib/db";
import { searchFlights } from "@/lib/flights/search-service";
import { buildMetadata } from "@/lib/seo";

function HomeLayout() {
  return (
    <main className="flex-1">
      <FlightSearchEngine />
      <DestinationsSlider />
      <ActivitiesSlider />
      <BlogSlider />
    </main>
  );
}

type FlightsPageProps = {
  searchParams?: Promise<{
    tripType?: string;
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    legs?: string;
    adults?: string;
    children?: string;
    infants?: string;
    cabinClass?: string;
    directOnly?: string;
  }>;
};

function parseMultiCityLegs(raw: string | undefined) {
  if (!raw)
    return [] as Array<{
      origin: string;
      destination: string;
      departureDate: string;
    }>;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (
          item,
        ): item is {
          origin?: string;
          destination?: string;
          departureDate?: string;
        } => Boolean(item && typeof item === "object"),
      )
      .map((item) => ({
        origin: String(item.origin ?? ""),
        destination: String(item.destination ?? ""),
        departureDate: String(item.departureDate ?? ""),
      }))
      .filter((leg) => leg.origin && leg.destination && leg.departureDate);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  searchParams,
}: FlightsPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const multiCityLegs = parseMultiCityLegs(resolvedSearchParams.legs);
  const isMultiCity = resolvedSearchParams.tripType === "multi-city";
  const hasSearch = isMultiCity
    ? multiCityLegs.length >= 2
    : Boolean(
        resolvedSearchParams.origin &&
        resolvedSearchParams.destination &&
        resolvedSearchParams.departureDate,
      );

  return buildMetadata({
    title:
      hasSearch &&
      resolvedSearchParams.origin &&
      resolvedSearchParams.destination
        ? `Flights from ${resolvedSearchParams.origin} to ${resolvedSearchParams.destination}`
        : "Flight Search",
    description: hasSearch
      ? "Review live flight search results and continue to booking when your route fits."
      : "Search and compare flight options with flexible trip types and cabin filters.",
    path: "/flights",
    keywords: ["flight search", "flight booking", "airfare"],
    noIndex: hasSearch,
  });
}

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const multiCityLegs = parseMultiCityLegs(resolvedSearchParams.legs);
  const isMultiCity = resolvedSearchParams.tripType === "multi-city";

  // No search yet — render the same layout as the home page
  if (
    (!isMultiCity &&
      (!resolvedSearchParams.origin ||
        !resolvedSearchParams.destination ||
        !resolvedSearchParams.departureDate)) ||
    (isMultiCity && multiCityLegs.length < 2)
  ) {
    return <HomeLayout />;
  }

  console.log("[Flights Page] Received searchParams:", resolvedSearchParams);

  const result = await searchFlights(resolvedSearchParams);
  console.log("[Flights Page] Search result:", {
    ok: result.ok,
    errors: result.ok ? "none" : result.errors,
  });

  if (!result.ok) {
    return (
      <main className="section-shell flex-1 py-10">
        <div className="alert alert-error bg-red-50 text-red-900">
          <div>
            <span>
              Flight search query is invalid. Please review route, dates, and
              passenger details.
            </span>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(result.errors, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!shouldBypassDatabase()) {
    try {
      const provider =
        result.source === "sabre"
          ? "SABRE"
          : result.source === "amadeus"
            ? "AMADEUS"
            : "INTERNAL";

      await prisma.flightSearchLog.create({
        data: {
          origin: result.query.origin,
          destination: result.query.destination,
          departureDate: new Date(
            `${result.query.departureDate}T00:00:00.000Z`,
          ),
          returnDate: result.query.returnDate
            ? new Date(`${result.query.returnDate}T00:00:00.000Z`)
            : null,
          adults: result.query.adults,
          children: result.query.children,
          infants: result.query.infants,
          cabinClass: result.query.cabinClass,
          provider,
          requestPayload: result.query,
          responsePayload: {
            source: result.source,
            resultCount: result.results.length,
          },
        },
      });
    } catch {
      // Keep page rendering resilient even if logging fails.
    }
  }

  const { query } = result;
  const originDisplay = getAirportDisplay(query.origin);
  const destinationDisplay = getAirportDisplay(query.destination);
  const originLabel = originDisplay
    ? `${originDisplay.city} (${query.origin})`
    : query.origin;
  const destinationLabel = destinationDisplay
    ? `${destinationDisplay.city} (${query.destination})`
    : query.destination;
  const searchSummary = `${originLabel} -> ${destinationLabel} · ${query.departureDate}${query.returnDate ? ` · ${query.returnDate}` : ""}`;

  return (
    <main className="flex-1 py-6">
      <MobileSearchToggle summary={searchSummary}>
        <FlightSearchEngine
          variant="embedded"
          initialValues={{
            tripType: query.tripType,
            directOnly: query.directOnly,
            adults: query.adults,
            children: query.children,
            infants: query.infants,
            cabinClass: query.cabinClass,
            origin: originLabel,
            originIata: query.origin,
            destination: destinationLabel,
            destinationIata: query.destination,
            departureDate: query.departureDate,
            returnDate: query.returnDate,
            multiCityLegs:
              query.tripType === "multi-city"
                ? (query.legs ?? []).map((leg) => {
                    const originDisplay = getAirportDisplay(leg.origin);
                    const destinationDisplay = getAirportDisplay(
                      leg.destination,
                    );

                    return {
                      origin: originDisplay
                        ? `${originDisplay.city} (${leg.origin})`
                        : leg.origin,
                      originIata: leg.origin,
                      destination: destinationDisplay
                        ? `${destinationDisplay.city} (${leg.destination})`
                        : leg.destination,
                      destinationIata: leg.destination,
                      departureDate: leg.departureDate,
                    };
                  })
                : undefined,
          }}
        />
      </MobileSearchToggle>

      <FareCalendarStrip query={query} />

      <FlightsResultsPanel
        offers={result.results}
        query={result.query}
        source={result.source}
        warnings={result.warnings}
      />
    </main>
  );
}
