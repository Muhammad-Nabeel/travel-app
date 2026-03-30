import { FlightsResultsPanel } from "@/components/features/flights/flights-results-panel";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { searchFlights } from "@/lib/flights/search-service";

type FlightsPageProps = {
  searchParams?: Promise<{
    tripType?: string;
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    adults?: string;
    children?: string;
    infants?: string;
    cabinClass?: string;
    directOnly?: string;
  }>;
};

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
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

  const { query } = result;

  return (
    <main className="flex-1 py-6">
      <FlightSearchEngine
        variant="embedded"
        initialValues={{
          tripType: query.tripType,
          directOnly: query.directOnly,
          adults: query.adults,
          children: query.children,
          infants: query.infants,
          cabinClass: query.cabinClass,
          origin: query.origin,
          originIata: query.origin,
          destination: query.destination,
          destinationIata: query.destination,
          departureDate: query.departureDate,
          returnDate: query.returnDate,
        }}
      />

      <FlightsResultsPanel
        offers={result.results}
        query={result.query}
        source={result.source}
        warnings={result.warnings}
      />
    </main>
  );
}
