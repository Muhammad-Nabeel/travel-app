import Image from "next/image";
import { ArrowRight, CalendarDays, Clock3, Plane } from "lucide-react";

import {
  getAirlineCode,
  getAirlineLogoSrc,
} from "@/lib/flights/airline-branding";
import type { FlightLeg, FlightOffer, TripType } from "@/lib/flights/types";

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

function getLegLabel(tripType: TripType, index: number, totalLegs: number) {
  if (tripType === "round-trip" && totalLegs === 2) {
    return index === 0 ? "Outbound" : "Return";
  }

  if (tripType === "multi-city" && totalLegs > 1) {
    return `Leg ${index + 1}`;
  }

  return "Flight";
}

function getTotalLabel(tripType: TripType) {
  if (tripType === "round-trip") return "Round-trip total";
  if (tripType === "multi-city") return "Multi-city total";
  return "One-way total";
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
  const isReturnLabel = label.toLowerCase().includes("return");

  return (
    <div className="flex items-start gap-4">
      {/* Airline logo */}
      <div className="shrink-0">
        {logoSrc ? (
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-line bg-white p-2">
            <Image
              src={logoSrc}
              alt={marketingCode}
              className="h-full w-full object-contain"
              width={48}
              height={48}
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-subtle text-sm font-bold text-foreground">
            {code.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1">
        {/* Label + direction icon */}
        <div className="mb-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-subtle px-2 py-0.5 text-xs font-semibold text-muted">
            {!isReturnLabel ? (
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
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isMultiStop
                  ? "bg-subtle text-foreground"
                  : "bg-success/10 text-success"
              }`}
            >
              {stopsLabel}
            </span>
            <div className="flex items-center gap-1">
              <div className="h-px w-12 bg-line sm:w-20" />
              <ArrowRight className="size-3 text-muted" />
            </div>
            <span className="flex items-center gap-1 text-xs text-muted">
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
  tripType: TripType;
  overrideTotalPrice?: number;
};

export function BookingFlightSummary({
  offer,
  tripType,
  overrideTotalPrice,
}: BookingFlightSummaryProps) {
  const fallbackLeg: FlightLeg = {
    legIndex: 0,
    origin: offer.origin,
    destination: offer.destination,
    departure: offer.departure,
    arrival: offer.arrival,
    durationMinutes: offer.durationMinutes,
    stops: offer.stops,
    segments: [],
  };
  const summaryLegs =
    offer.legs && offer.legs.length > 0 ? offer.legs : [fallbackLeg];

  return (
    <div className="rounded-card border border-line bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">
          Your flight
        </h2>
        <span className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold capitalize text-foreground">
          {offer.cabin}
        </span>
      </div>

      {/* Legs */}
      <div className="divide-y divide-line">
        {summaryLegs.map((leg, index) => (
          <div
            key={`${leg.legIndex}-${leg.origin}-${leg.destination}-${leg.departure}-${index}`}
            className="px-5 py-5"
          >
            <LegRow
              leg={leg}
              label={getLegLabel(tripType, index, summaryLegs.length)}
              airline={offer.airline}
            />
          </div>
        ))}
      </div>

      {/* Price footer */}
      <div className="flex items-center justify-between rounded-b-card border-t border-line bg-subtle px-5 py-4">
        <div>
          <p className="text-xs text-muted">{getTotalLabel(tripType)}</p>
          <p className="text-2xl font-bold text-foreground">
            {formatMoney(overrideTotalPrice ?? offer.price, offer.currency)}
          </p>
          <p className="text-xs text-muted">Taxes & fees included</p>
        </div>
        {offer.refundable !== undefined && (
          <span
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              offer.refundable
                ? "bg-success/10 text-success"
                : "bg-white text-muted ring-1 ring-line"
            }`}
          >
            {offer.refundable ? "Refundable" : "Non-refundable"}
          </span>
        )}
      </div>
    </div>
  );
}
