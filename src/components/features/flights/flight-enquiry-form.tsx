"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle, Loader2, Plane, Send, Users } from "lucide-react";

import type { FlightSearchQuery } from "@/lib/flights/types";
import { submitServiceRequest } from "@/lib/service-requests";

export type FlightEnquiryLeg = {
  origin: string;
  originLabel: string;
  destination: string;
  destinationLabel: string;
  departureDate: string;
};

type FlightEnquiryFormProps = {
  query: FlightSearchQuery;
  /** Legs in travel order; a round trip includes the return leg. */
  legs: FlightEnquiryLeg[];
};

function formatDate(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function formatPassengers(query: FlightSearchQuery) {
  const parts = [`${query.adults} Adult${query.adults === 1 ? "" : "s"}`];
  if (query.children > 0) parts.push(`${query.children} Child${query.children === 1 ? "" : "ren"}`);
  if (query.infants > 0) parts.push(`${query.infants} Infant${query.infants === 1 ? "" : "s"}`);
  return parts.join(", ");
}

const TRIP_TYPE_LABEL: Record<FlightSearchQuery["tripType"], string> = {
  "one-way": "One-way",
  "round-trip": "Round-trip",
  "multi-city": "Multi-city",
};

/** Shown instead of live results while Sabre is switched off: the trip is already chosen, so only contact details are asked. */
export function FlightEnquiryForm({ query, legs }: FlightEnquiryFormProps) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    message: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const passengers = formatPassengers(query);
  const routeTitle = legs
    .map((leg) => `${leg.origin} → ${leg.destination} (${leg.departureDate})`)
    .join(", ");

  function validate() {
    const next: Partial<Record<keyof typeof form, string>> = {};

    if (!form.customerName.trim()) {
      next.customerName = "Name is required.";
    }

    if (!form.customerEmail.trim()) {
      next.customerEmail = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      next.customerEmail = "Enter a valid email address.";
    }

    if (!form.customerPhone.trim()) {
      next.customerPhone = "Phone number is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await submitServiceRequest({
        type: "FLIGHT",
        title: `${TRIP_TYPE_LABEL[query.tripType]} · ${routeTitle} · ${passengers} · ${query.cabinClass}`,
        currency: query.currency,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        payload: {
          tripType: query.tripType,
          legs: legs.map(({ origin, destination, departureDate }) => ({
            origin,
            destination,
            departureDate,
          })),
          adults: query.adults,
          children: query.children,
          infants: query.infants,
          cabinClass: query.cabinClass,
          directOnly: query.directOnly,
          currency: query.currency,
          message: form.message.trim() || null,
          submittedAt: new Date().toISOString(),
        },
      });

      setReference(response.reference ?? null);
      setStatus("success");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to submit your request. Please try again.",
      );
      setStatus("error");
    }
  }

  const inputClass = (hasError: boolean) =>
    `h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
      hasError ? "border-deal bg-white" : "border-line bg-white"
    }`;

  return (
    <section className="section-shell mt-6 pb-16">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <aside className="h-fit rounded-card border border-line bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">
            Your trip
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">
            {TRIP_TYPE_LABEL[query.tripType]} flight
          </h2>

          <ol className="mt-4 space-y-3">
            {legs.map((leg, index) => (
              <li
                key={`${leg.origin}-${leg.destination}-${index}`}
                className="rounded-lg border border-line bg-subtle px-4 py-3"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Plane className="size-4 text-brand" />
                  {leg.originLabel} → {leg.destinationLabel}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                  <CalendarDays className="size-4" />
                  {formatDate(leg.departureDate)}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <Users className="size-4 text-muted" />
            {passengers} · {query.cabinClass}
            {query.directOnly ? " · Direct only" : ""}
          </p>
        </aside>

        <div className="rounded-card border border-line bg-white p-6">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle className="h-11 w-11 text-success" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  Request received!
                </h3>
                <p className="mt-1 text-sm text-foreground">
                  Thanks {form.customerName.trim()}. Our team will contact you
                  with the best fares for this trip.
                </p>
                {reference ? (
                  <p className="mt-3 inline-block rounded-full bg-success/10 px-4 py-1 text-sm font-semibold text-foreground">
                    Ref: {reference}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Get fares for this trip
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Share your contact details and our travel team will send you
                  the best available fares.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="flight-name"
                  className="text-sm font-semibold text-foreground"
                >
                  Full name <span className="text-deal">*</span>
                </label>
                <input
                  id="flight-name"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                  className={inputClass(Boolean(errors.customerName))}
                  placeholder="e.g. Ahmed Khan"
                  autoComplete="name"
                />
                {errors.customerName ? (
                  <p className="text-[13px] text-deal">{errors.customerName}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="flight-email"
                    className="text-sm font-semibold text-foreground"
                  >
                    Email address <span className="text-deal">*</span>
                  </label>
                  <input
                    id="flight-email"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerEmail: e.target.value }))
                    }
                    className={inputClass(Boolean(errors.customerEmail))}
                    placeholder="e.g. ahmed@example.com"
                    autoComplete="email"
                  />
                  {errors.customerEmail ? (
                    <p className="text-[13px] text-deal">{errors.customerEmail}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="flight-phone"
                    className="text-sm font-semibold text-foreground"
                  >
                    Phone <span className="text-deal">*</span>
                  </label>
                  <input
                    id="flight-phone"
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerPhone: e.target.value }))
                    }
                    className={inputClass(Boolean(errors.customerPhone))}
                    placeholder="+92 300 1234567"
                    autoComplete="tel"
                  />
                  {errors.customerPhone ? (
                    <p className="text-[13px] text-deal">{errors.customerPhone}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="flight-message"
                  className="text-sm font-semibold text-foreground"
                >
                  Additional message
                </label>
                <textarea
                  id="flight-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Preferred airline, flexible dates, baggage needs..."
                />
              </div>

              {serverError ? (
                <p className="rounded-lg border border-deal/30 bg-deal/5 px-4 py-3 text-sm text-deal">
                  {serverError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Request fares
                  </>
                )}
              </button>

              <p className="text-center text-xs text-muted">
                We usually respond within 24 hours.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
