import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BookingFormClient } from "@/components/features/booking/booking-form-client";
import { searchFlights } from "@/lib/flights/search-service";
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
 * The booking page re-runs the same live search so it can resolve the
 * selected offer by ID without storing anything client-side across
 * navigations. Offer IDs are derived from the itinerary and price, so a fare
 * that changed or sold out since the results page is not found here.
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
      <div className="section-shell flex-1 py-10">
        <div className="alert alert-error">
          <span>
            Unable to reload your flight selection. Please go back and try
            again.
          </span>
        </div>
      </div>
    );
  }

  // With live search off there are no offers to book; send the user to the fare request form.
  if (!result.liveSearchEnabled) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(searchQuery)) {
      if (value !== undefined) searchParams.set(key, value);
    }
    redirect(`/flights?${searchParams.toString()}`);
  }

  const selectedOffer = offerId
    ? result.results.find((o) => o.id === offerId)
    : undefined;

  // Never substitute another offer: the customer would book a flight or
  // price they did not choose. Send them back to fresh results instead.
  if (!selectedOffer) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(searchQuery)) {
      if (value !== undefined) searchParams.set(key, value);
    }
    return (
      <div className="section-shell flex-1 py-10">
        <div className="alert alert-warning bg-amber-50 text-amber-900">
          <div>
            <p className="font-semibold">This fare is no longer available.</p>
            <p className="mt-1 text-sm">
              Airline prices and seats change quickly. Please pick a flight
              from the latest results.
            </p>
            <Link
              href={`/flights?${searchParams.toString()}`}
              className="btn btn-sm mt-3"
            >
              See latest fares
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <BookingFormClient offer={selectedOffer} query={result.query} />
    </div>
  );
}
