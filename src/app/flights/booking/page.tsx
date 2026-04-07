import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingFormClient } from "@/components/features/booking/booking-form-client";
import { searchFlights } from "@/lib/flights/search-service";
import type { FlightOffer } from "@/lib/flights/types";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Flight Booking",
  description:
    "Review the selected itinerary and complete traveler details for your booking.",
  path: "/flights/booking",
  noIndex: true,
});

/**
 * /flights/booking?offerId=<id>&<same search params as /flights>
 *
 * The booking page re-runs the same search (server-side, cached by Next.js
 * fetch de-dup) so it can resolve the selected offer by ID without storing
 * anything client-side across navigations.
 */

type BookingPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = (await searchParams) ?? {};
  const { offerId, ...searchQuery } = params;

  // Re-run the same flight search to recover the offer list
  const result = await searchFlights(searchQuery);

  if (!result.ok) {
    return (
      <main className="section-shell flex-1 py-10">
        <div className="alert alert-error">
          <span>
            Unable to reload your flight selection. Please go back and try
            again.
          </span>
        </div>
      </main>
    );
  }

  let selectedOffer: FlightOffer | undefined;

  if (offerId) {
    selectedOffer = result.results.find((o) => o.id === offerId);
  }

  // Fall back to first result if ID not found (e.g. page refresh after sort)
  if (!selectedOffer) {
    selectedOffer = result.results[0];
  }

  if (!selectedOffer) {
    notFound();
  }

  return (
    <main className="flex-1">
      <BookingFormClient offer={selectedOffer} query={result.query} />
    </main>
  );
}
