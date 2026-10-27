"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { BookingFlightSummary } from "@/components/features/booking/booking-flight-summary";
import { BookingSteps } from "@/components/features/booking/booking-steps";
import {
  ContactDetailsForm,
  validateEmail,
  validatePhone,
} from "@/components/features/booking/contact-details-form";
import {
  PassengerForm,
  validatePassenger,
} from "@/components/features/booking/passenger-form";
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
  const [showErrors, setShowErrors] = useState(false);

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const invalid =
      validatePhone(form.contact.phone) !== null ||
      validateEmail(form.contact.email) !== null ||
      form.passengers.some((p) => Object.keys(validatePassenger(p)).length > 0);
    if (invalid) {
      setShowErrors(true);
      const formEl = e.currentTarget;
      // Wait for the error states to render, then focus the first one.
      requestAnimationFrame(() => {
        formEl.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }

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

  const travellerCount = form.passengers.length;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <BookingSteps current={0} />
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        {/* ── Left column: contact + passengers ── */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
              Who&apos;s travelling?
            </h1>
            <p className="mt-1 text-sm text-muted">
              Enter names exactly as they appear on each passport.
            </p>
          </div>

          {showErrors ? (
            <p
              role="alert"
              className="rounded-lg border border-deal/30 bg-deal/5 px-4 py-3 text-sm text-deal"
            >
              Some details are missing. Check the highlighted fields.
            </p>
          ) : null}

          <ContactDetailsForm
            contact={form.contact}
            onChange={updateContact}
            showErrors={showErrors}
          />

          {sortedPassengers.map((passenger, displayIdx) => (
            <PassengerForm
              key={`${passenger.type}-${passenger.index}`}
              passenger={passenger}
              displayNumber={displayIdx + 1}
              showErrors={showErrors}
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

        {/* ── Right column: trip summary + continue ── */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--app-header-height)+1.5rem)]">
          <BookingFlightSummary offer={offer} tripType={query.tripType} />

          <div className="rounded-card border border-line bg-white p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted">
                {travellerCount} traveller{travellerCount !== 1 ? "s" : ""}
              </span>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: offer.currency,
                  maximumFractionDigits: 0,
                }).format(offer.price)}
              </span>
            </div>
            <p className="mt-0.5 text-right text-xs text-muted">
              Service charges, if any, are shown on the next step
            </p>
            <button
              type="submit"
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-white transition hover:bg-brand-strong"
            >
              Continue to payment
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Lock className="size-3.5" />
              Nothing is charged on this step
            </p>
          </div>

          <p className="text-center text-xs text-muted">
            By continuing you agree to our{" "}
            <Link href="/terms-conditions" className="underline hover:text-foreground">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </aside>
      </div>
    </form>
  );
}
