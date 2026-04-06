"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BookingFlightSummary } from "@/components/features/booking/booking-flight-summary";
import { ContactDetailsForm } from "@/components/features/booking/contact-details-form";
import { PassengerForm } from "@/components/features/booking/passenger-form";
import { trackGa4Event } from "@/lib/analytics/ga4-events";
import type {
  BookingFormState,
  BookingPayload,
  ContactDetails,
  PassengerDetails,
  PassengerType,
} from "@/lib/flights/booking-types";
import type { FlightOffer, FlightSearchQuery } from "@/lib/flights/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function buildInitialPassengers(query: FlightSearchQuery): PassengerDetails[] {
  const list: PassengerDetails[] = [];

  const blank = (): Omit<PassengerDetails, "type" | "index"> => ({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    passportExpiry: "",
    wheelchairRequired: false,
  });

  for (let i = 0; i < query.adults; i++) {
    list.push({ ...blank(), type: "adult", index: i });
  }
  for (let i = 0; i < query.children; i++) {
    list.push({ ...blank(), type: "child", index: i });
  }
  for (let i = 0; i < query.infants; i++) {
    list.push({ ...blank(), type: "infant", index: i });
  }

  return list;
}

function buildInitialContact(): ContactDetails {
  return { phone: "", email: "" };
}

// ── props ─────────────────────────────────────────────────────────────────────

export type BookingFormClientProps = {
  offer: FlightOffer;
  query: FlightSearchQuery;
};

// ── component ─────────────────────────────────────────────────────────────────

export function BookingFormClient({ offer, query }: BookingFormClientProps) {
  const router = useRouter();

  const [form, setForm] = useState<BookingFormState>({
    contact: buildInitialContact(),
    passengers: buildInitialPassengers(query),
  });

  function updatePassenger(index: number, updated: PassengerDetails) {
    setForm((prev) => {
      const passengers = [...prev.passengers];
      passengers[index] = updated;
      return { ...prev, passengers };
    });
  }

  function updateContact(contact: ContactDetails) {
    setForm((prev) => ({ ...prev, contact }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: BookingPayload = {
      offer,
      query,
      contact: form.contact,
      passengers: form.passengers,
      createdAt: new Date().toISOString(),
    };

    trackGa4Event("proceed_to_payment", {
      trip_type: query.tripType,
      origin: query.origin,
      destination: query.destination,
      departure_date: query.departureDate,
      return_date: query.returnDate ?? "",
      passenger_count: form.passengers.length,
      amount: offer.price,
      currency: offer.currency,
    });

    sessionStorage.setItem("booking_payload", JSON.stringify(payload));
    router.push("/flights/payment");
  }

  const passengerTypeOrder: PassengerType[] = ["adult", "child", "infant"];
  const sortedPassengers = [...form.passengers].sort(
    (a, b) =>
      passengerTypeOrder.indexOf(a.type) - passengerTypeOrder.indexOf(b.type),
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* ── Left column: contact + passengers ── */}
        <div className="flex flex-col gap-5">
          {/* Section heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Passenger Details
            </h1>
            <p className="mt-1 text-sm text-muted">
              Please enter details exactly as they appear on each
              passenger&apos;s passport.
            </p>
          </div>

          {/* Contact */}
          <ContactDetailsForm contact={form.contact} onChange={updateContact} />

          {/* Passengers */}
          {sortedPassengers.map((passenger, displayIdx) => (
            <PassengerForm
              key={`${passenger.type}-${passenger.index}`}
              passenger={passenger}
              displayNumber={displayIdx + 1}
              onChange={(updated) => {
                const globalIdx = form.passengers.findIndex(
                  (p) =>
                    p.type === passenger.type && p.index === passenger.index,
                );
                updatePassenger(globalIdx, updated);
              }}
            />
          ))}
        </div>

        {/* ── Right column: flight summary + confirm ── */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
          <BookingFlightSummary offer={offer} tripType={query.tripType} />

          {/* Confirm CTA */}
          <button
            type="submit"
            className="btn btn-primary w-full rounded-xl py-3 text-base shadow"
          >
            Confirm & Proceed to Payment
          </button>

          <p className="text-center text-[11px] text-muted">
            By proceeding you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </form>
  );
}
