import { ArrowRight, CalendarDays, Clock3, Plane } from "lucide-react";

import {
  getAirlineCode,
  getAirlineLogoSrc,
} from "@/lib/flights/airline-branding";
import type { FlightLeg, FlightOffer } from "@/lib/flights/types";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatDuration(minutes?: number) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── sub-component: single leg row ────────────────────────────────────────────

type LegRowProps = {
  leg: FlightLeg;
  label: string;
  airline: string;
};

function LegRow({ leg, label, airline }: LegRowProps) {
  const marketingCode =
    (leg.segments[0] as { airline?: string } | undefined)?.airline ?? airline;
  const logoSrc = getAirlineLogoSrc(marketingCode, airline);
  const code = getAirlineCode(marketingCode, airline);

  const stopsLabel =
    leg.stops === 0 ? "Direct" : `${leg.stops} stop${leg.stops > 1 ? "s" : ""}`;
  const isMultiStop = leg.stops > 0;

  return (
    <div className="flex items-start gap-4">
      {/* Airline logo */}
      <div className="shrink-0">
        {logoSrc ? (
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-base-200 bg-white p-2 shadow-sm">
            <img
              src={logoSrc}
              alt={marketingCode}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
            {code.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1">
        {/* Label + direction icon */}
        <div className="mb-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-base-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
            {label === "Outbound" ? (
              <Plane className="size-3" />
            ) : (
              <Plane className="size-3 -scale-x-100" />
            )}
            {label}
          </span>
          <span className="text-xs text-muted">{marketingCode}</span>
        </div>

        {/* Route & times */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-foreground">
              {formatTime(leg.departure)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-foreground">
              {leg.origin}
            </p>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isMultiStop
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {stopsLabel}
            </span>
            <div className="flex items-center gap-1">
              <div className="h-px w-12 bg-base-300 sm:w-20" />
              <ArrowRight className="size-3 text-muted" />
            </div>
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Clock3 className="size-3" />
              {formatDuration(leg.durationMinutes)}
            </span>
          </div>

          <div className="text-center">
            <p className="text-xl font-bold leading-none text-foreground">
              {formatTime(leg.arrival)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-foreground">
              {leg.destination}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted">
          <CalendarDays className="size-3.5" />
          {formatDate(leg.departure)}
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type BookingFlightSummaryProps = {
  offer: FlightOffer;
  isRoundTrip: boolean;
};

export function BookingFlightSummary({
  offer,
  isRoundTrip,
}: BookingFlightSummaryProps) {
  const outboundLeg: FlightLeg = offer.legs?.[0] ?? {
    legIndex: 0,
    origin: offer.origin,
    destination: offer.destination,
    departure: offer.departure,
    arrival: offer.arrival,
    durationMinutes: offer.durationMinutes,
    stops: offer.stops,
    segments: [],
  };
  const returnLeg = isRoundTrip ? offer.legs?.[1] : undefined;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-base-200 px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">
          Your Selected Flight
        </h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {offer.cabin}
        </span>
      </div>

      {/* Legs */}
      <div className="divide-y divide-base-200">
        <div className="px-5 py-5">
          <LegRow leg={outboundLeg} label="Outbound" airline={offer.airline} />
        </div>
        {returnLeg && (
          <div className="px-5 py-5">
            <LegRow leg={returnLeg} label="Return" airline={offer.airline} />
          </div>
        )}
      </div>

      {/* Price footer */}
      <div className="flex items-center justify-between rounded-b-2xl border-t border-base-200 bg-base-200/40 px-5 py-4">
        <div>
          <p className="text-xs text-muted">
            {isRoundTrip ? "Round-trip total" : "One-way total"}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {formatMoney(offer.price, offer.currency)}
          </p>
          <p className="text-[11px] text-muted">Taxes & fees included</p>
        </div>
        {offer.refundable !== undefined && (
          <span
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              offer.refundable
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {offer.refundable ? "Refundable" : "Non-refundable"}
          </span>
        )}
      </div>
    </div>
  );
}
