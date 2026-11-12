import type { Metadata } from "next";

import { getPageBanner } from "@/lib/admin-settings/page-banner-settings";
import {
  buildStaticPageMetadata,
  getStaticPageSeo,
} from "@/lib/admin-settings/seo-settings";
import { FareCalendarStrip } from "@/components/features/flights/fare-calendar-strip";
import {
  FlightEnquiryForm,
  type FlightEnquiryLeg,
} from "@/components/features/flights/flight-enquiry-form";
import { FlightsResultsPanel } from "@/components/features/flights/flights-results-panel";
import { MobileSearchToggle } from "@/components/features/flights/mobile-search-toggle";
import { PopularFlightRoutes } from "@/components/features/flights/popular-flight-routes";
import { StructuredData } from "@/components/shared/structured-data";
import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { getAirportDisplay } from "@/lib/aviation-reference";
import { recordFlightSearch } from "@/lib/flights/search-log";
import { searchFlights } from "@/lib/flights/search-service";
import {
  buildMetadata,
  createBreadcrumbSchema,
  createWebPageSchema,
} from "@/lib/seo";

async function HomeLayout() {
  const [heroImage, seo] = await Promise.all([
    getPageBanner("flights"),
    getStaticPageSeo("flights"),
  ]);
  return (
    <div className="flex-1">
      {/* Same admin-managed title/description as the page metadata. */}
      <StructuredData
        data={[
          createWebPageSchema({
            title: seo.title,
            description: seo.description,
            path: seo.path,
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Flights", path: seo.path },
          ]),
        ]}
      />
      <FlightSearchEngine heroImage={heroImage} />
      <PopularFlightRoutes />
      <DestinationsSlider />
      <ActivitiesSlider />
      <BlogSlider />
    </div>
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
    currency?: string;
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

  if (!hasSearch) {
    return buildStaticPageMetadata("flights");
  }

  // Search result URLs are per-user and infinite; never index them.
  return buildMetadata({
    title:
      resolvedSearchParams.origin && resolvedSearchParams.destination
        ? `Flights from ${resolvedSearchParams.origin} to ${resolvedSearchParams.destination}`
        : "Flight Search Results",
    description:
      "Review live flight search results and continue to booking when your route fits.",
    path: "/flights",
    noIndex: true,
  });}

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

  const result = await searchFlights(resolvedSearchParams);

  if (!result.ok) {
    return (
      <div className="section-shell flex-1 py-10">
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
      </div>
    );
  }

  recordFlightSearch(result);

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

  const toEnquiryLeg = (leg: {
    origin: string;
    destination: string;
    departureDate: string;
  }): FlightEnquiryLeg => {
    const from = getAirportDisplay(leg.origin);
    const to = getAirportDisplay(leg.destination);
    return {
      ...leg,
      originLabel: from ? `${from.city} (${leg.origin})` : leg.origin,
      destinationLabel: to ? `${to.city} (${leg.destination})` : leg.destination,
    };
  };
  const enquiryLegs =
    query.tripType === "multi-city"
      ? (query.legs ?? []).map(toEnquiryLeg)
      : [
          toEnquiryLeg(query),
          ...(query.tripType === "round-trip" && query.returnDate
            ? [
                toEnquiryLeg({
                  origin: query.destination,
                  destination: query.origin,
                  departureDate: query.returnDate,
                }),
              ]
            : []),
        ];

  return (
    <div className="flex-1 py-6">
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

      {result.liveSearchEnabled && result.results.length > 0 ? (
        <>
          <FareCalendarStrip query={query} />

          <FlightsResultsPanel
            offers={result.results}
            query={result.query}
            source={result.source}
            warnings={result.warnings}
          />
        </>
      ) : (
        // Live search off, failed, or found nothing: the search becomes a fare request.
        <>
          {result.warnings.length > 0 ? (
            <div className="section-shell mt-6">
              <div className="alert alert-warning bg-amber-50 text-amber-900">
                <span>{result.warnings[0]}</span>
              </div>
            </div>
          ) : null}
          <FlightEnquiryForm query={query} legs={enquiryLegs} />
        </>
      )}
    </div>
  );
}
