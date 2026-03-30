"use client";

import { useState } from "react";
import {
  Armchair,
  BaggageClaim,
  BadgeCheck,
  ChevronDown,
  Clock3,
  Moon,
  Plane,
  ReceiptText,
  ShieldX,
} from "lucide-react";

import type { FlightOffer } from "@/lib/flights/types";
import { FlightInfoTooltip } from "@/components/features/flights/flight-info-tooltip";

type AirportLookupEntry = {
  iata: string;
  city: string;
  country: string;
  airportName: string;
};

type FlightResultCardProps = {
  offer: FlightOffer;
  defaultOpen?: boolean;
  highlighted?: boolean;
  onSelect?: () => void;
  airportLookup?: Record<string, AirportLookupEntry>;
  airlineLookup?: Record<string, string>;
};

function normalizeAirportCode(value: string) {
  return value.trim().toUpperCase().slice(0, 3);
}

function normalizeAirlineCode(value: string) {
  return value.trim().toUpperCase().slice(0, 3);
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDuration(minutes?: number) {
  if (!minutes || minutes <= 0) {
    return "Duration unavailable";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatClockTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function getDayOffsetLabel(departure: string, arrival: string) {
  const departureDate = new Date(departure);
  const arrivalDate = new Date(arrival);

  if (
    Number.isNaN(departureDate.getTime()) ||
    Number.isNaN(arrivalDate.getTime())
  ) {
    return "";
  }

  const depDay = Date.UTC(
    departureDate.getUTCFullYear(),
    departureDate.getUTCMonth(),
    departureDate.getUTCDate(),
  );
  const arrDay = Date.UTC(
    arrivalDate.getUTCFullYear(),
    arrivalDate.getUTCMonth(),
    arrivalDate.getUTCDate(),
  );

  const offset = Math.round((arrDay - depDay) / 86_400_000);
  return offset > 0 ? `+${offset}` : "";
}

type StopoverInfo = {
  airport: string;
  durationMinutes: number;
  isOvernight: boolean;
};

function getStopoverInfos(offer: FlightOffer): StopoverInfo[] {
  const firstLeg = offer.legs?.[0];
  if (!firstLeg || firstLeg.segments.length <= 1) return [];

  return firstLeg.segments.slice(0, -1).map((seg, i) => {
    const nextSeg = firstLeg.segments[i + 1];
    const arrTime = new Date(seg.arrival).getTime();
    const depTime = new Date(nextSeg.departure).getTime();
    const durationMinutes = Math.max(
      0,
      Math.round((depTime - arrTime) / 60_000),
    );
    const arrDate = new Date(seg.arrival);
    const depDate = new Date(nextSeg.departure);
    const isOvernight =
      arrDate.getUTCDate() !== depDate.getUTCDate() ||
      arrDate.getUTCMonth() !== depDate.getUTCMonth() ||
      arrDate.getUTCFullYear() !== depDate.getUTCFullYear();
    return { airport: seg.destination, durationMinutes, isOvernight };
  });
}

export function FlightResultCard({
  offer,
  defaultOpen = false,
  highlighted = false,
  onSelect,
  airportLookup,
  airlineLookup,
}: FlightResultCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const stopoverInfos = getStopoverInfos(offer);
  const dayOffset = getDayOffsetLabel(offer.departure, offer.arrival);
  const originRef = airportLookup?.[normalizeAirportCode(offer.origin)];
  const destinationRef =
    airportLookup?.[normalizeAirportCode(offer.destination)];
  const airlineName =
    airlineLookup?.[normalizeAirlineCode(offer.airline)] ?? offer.airline;

  const hasLegs = (offer.legs?.length ?? 0) > 0;
  const hasMultiSegment =
    offer.legs?.some((l) => l.segments.length > 1) ?? false;
  const hasFares = (offer.passengerFares?.length ?? 0) > 0;
  const firstBaggage = offer.passengerFares?.[0]?.baggage;

  const PAX_LABEL: Record<string, string> = {
    ADT: "Adult",
    CNN: "Child",
    INF: "Infant",
  };

  return (
    <article
      className={`cursor-pointer rounded-2xl border bg-base-100 shadow-sm transition-shadow duration-200 hover:shadow-md ${
        highlighted
          ? "border-primary/70 ring-2 ring-primary/20"
          : "border-base-300"
      }`}
      onClick={onSelect}
    >
      <div className="grid gap-4 p-4 md:grid-cols-[180px_minmax(0,1fr)_190px] md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-bold lowercase tracking-wide text-emerald-600">
            {offer.airline.slice(0, 6)}
          </div>
          <div>
            <p className="text-base font-medium text-foreground">
              {airlineName}
            </p>
            <p className="text-xs text-muted-foreground">
              {offer.flightNumber ?? "Flight"}
            </p>
          </div>
        </div>

        <div className="px-1 md:px-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div>
              <p className="text-3xl font-semibold leading-none text-foreground">
                {formatClockTime(offer.departure)}
              </p>
              <p className="mt-2 text-sm font-semibold text-lime-600">
                {offer.origin}
              </p>
              <p className="mt-1 text-[11px] leading-tight text-muted">
                {originRef?.city ?? offer.origin}
              </p>
            </div>

            <div>
              <p className="mb-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Clock3 className="size-3.5" />
                {formatDuration(offer.durationMinutes)}
              </p>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-base-300 bg-base-100" />
                <span className="relative h-1 flex-1 rounded-full bg-base-300">
                  {stopoverInfos.slice(0, 2).map((stopover, index) => (
                    <span
                      key={`${offer.id}-stop-${stopover.airport}-${index}`}
                      className="group absolute top-1/2 h-3 w-3 -translate-y-1/2 cursor-default rounded-full border-2 border-primary bg-base-100"
                      style={{
                        left: `${((index + 1) * 100) / (stopoverInfos.length + 1)}%`,
                      }}
                    >
                      <FlightInfoTooltip className="bottom-full left-1/2 mb-2 -translate-x-1/2">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          {stopover.isOvernight && (
                            <Moon className="size-3 text-indigo-500" />
                          )}
                          {stopover.airport
                            ? `Stopover · ${stopover.airport}`
                            : "Stopover"}
                        </span>
                        {stopover.durationMinutes > 0 && (
                          <span className="mt-0.5 block text-muted">
                            {formatDuration(stopover.durationMinutes)}
                            {stopover.isOvernight ? " · Overnight stay" : ""}
                          </span>
                        )}
                      </FlightInfoTooltip>
                    </span>
                  ))}
                </span>
                <span className="h-3 w-3 rounded-full border-2 border-base-300 bg-base-100" />
              </div>
              <div className="mt-2 flex justify-center">
                {offer.stops === 0 ? (
                  <span className="text-xs text-muted-foreground">Direct</span>
                ) : stopoverInfos.length > 0 ? (
                  <span className="group relative inline-flex cursor-default">
                    <span className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
                      {offer.stops} stop{offer.stops > 1 ? "s" : ""}
                      {` · ${stopoverInfos
                        .map((s) => s.airport)
                        .filter(Boolean)
                        .join(" • ")}`}
                    </span>
                    <FlightInfoTooltip className="bottom-full left-1/2 mb-2 -translate-x-1/2">
                      {stopoverInfos.map((s, i) => (
                        <span
                          key={`${s.airport}-${i}`}
                          className={`block ${i > 0 ? "mt-2 border-t border-base-200 pt-2" : ""}`}
                        >
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            {s.isOvernight && (
                              <Moon className="size-3 text-indigo-500" />
                            )}
                            {s.airport ? `Stopover · ${s.airport}` : "Stopover"}
                          </span>
                          {s.durationMinutes > 0 && (
                            <span className="mt-0.5 block text-muted">
                              {formatDuration(s.durationMinutes)}
                              {s.isOvernight ? " · Overnight stay" : ""}
                            </span>
                          )}
                        </span>
                      ))}
                    </FlightInfoTooltip>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {offer.stops} stop{offer.stops > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-3xl font-semibold leading-none text-foreground">
                {formatClockTime(offer.arrival)}
              </p>
              <div className="mt-2 inline-flex items-center justify-end gap-1 text-sm font-semibold">
                <span className="text-lime-600">{offer.destination}</span>
                {dayOffset ? (
                  <span className="group relative inline-flex cursor-default items-center gap-0.5 text-muted-foreground">
                    <span className="text-xs">{dayOffset}</span>
                    <Moon className="size-3.5" />
                    <FlightInfoTooltip className="bottom-full right-0 mb-2">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Moon className="size-3 text-indigo-500" />
                        Overnight Flight
                      </span>
                      <span className="mt-0.5 block text-muted">
                        Arrives{" "}
                        {parseInt(dayOffset) > 1
                          ? `${dayOffset} days`
                          : "next day"}{" "}
                        after departure
                      </span>
                    </FlightInfoTooltip>
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] leading-tight text-muted">
                {destinationRef?.city ?? offer.destination}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-base-300 pt-3 text-left md:border-l md:border-t-0 md:pt-0 md:pl-6 md:text-right">
          <p className="truncate text-sm text-muted-foreground">
            Includes taxes and fees
          </p>
          <p className="mt-1 text-2xl font-semibold leading-none text-foreground">
            {formatMoney(offer.price, offer.currency)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Per person</p>
        </div>
      </div>

      {/* Flight details footer */}
      <div className="border-t border-base-200 px-4 py-2 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Flight details
          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ── Click-toggle detail panel ── */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-5 border-t border-dashed border-base-300 px-4 pb-5 pt-4">
            {/* Itinerary */}
            {hasLegs && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
                  <Plane className="size-3.5" />
                  Itinerary
                  {!hasMultiSegment && (
                    <span className="ml-1 rounded-full bg-base-200 px-2 py-0.5 font-normal normal-case tracking-normal">
                      {offer.stops === 0
                        ? "Direct"
                        : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}
                    </span>
                  )}
                </p>
                {offer.legs!.map((leg) => (
                  <div key={leg.legIndex} className="space-y-2">
                    {offer.legs!.length > 1 && (
                      <p className="text-xs font-medium text-muted">
                        {leg.legIndex === 0 ? "Outbound" : "Return"} ·{" "}
                        {leg.origin} → {leg.destination}
                      </p>
                    )}
                    {leg.segments.map((seg) => (
                      <div
                        key={seg.segmentIndex}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-base-200 bg-base-200/60 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="text-lg font-semibold leading-none text-foreground">
                            {formatClockTime(seg.departure)}
                          </p>
                          <p className="mt-1 font-semibold text-brand">
                            {seg.origin}
                          </p>
                          <p className="text-xs text-muted">
                            {new Date(seg.departure).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short" },
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-2 text-center">
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Plane className="size-3" />
                            <span>{seg.flightNumber}</span>
                            {seg.aircraft ? (
                              <span>· {seg.aircraft}</span>
                            ) : null}
                          </div>
                          <div className="h-px w-14 border-t border-dashed border-base-300" />
                          <span className="rounded-full bg-base-300 px-2 py-0.5 text-[10px] font-medium text-muted">
                            {seg.cabin}
                            {seg.bookingClass ? ` · ${seg.bookingClass}` : ""}
                          </span>
                          {seg.durationMinutes ? (
                            <span className="text-[10px] text-muted">
                              {formatDuration(seg.durationMinutes)}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold leading-none text-foreground">
                            {formatClockTime(seg.arrival)}
                          </p>
                          <p className="mt-1 font-semibold text-brand">
                            {seg.destination}
                          </p>
                          <p className="text-xs text-muted">
                            {new Date(seg.arrival).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Fare breakdown */}
            {hasFares && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
                  <ReceiptText className="size-3.5" />
                  Fare breakdown
                </p>
                <div className="overflow-x-auto rounded-xl border border-base-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-base-200/70">
                        <th className="py-2 pl-4 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Passenger
                        </th>
                        <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Base fare
                        </th>
                        <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Taxes
                        </th>
                        <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {offer.passengerFares!.map((fare) => (
                        <tr
                          key={fare.passengerType}
                          className="border-t border-base-200"
                        >
                          <td className="py-2 pl-4 pr-4 font-medium text-foreground">
                            {PAX_LABEL[fare.passengerType] ??
                              fare.passengerType}{" "}
                            × {fare.quantity}
                          </td>
                          <td className="py-2 pr-4 text-muted">
                            {formatMoney(fare.baseFare, fare.currency)}
                          </td>
                          <td className="py-2 pr-4 text-muted">
                            {formatMoney(fare.taxes, fare.currency)}
                          </td>
                          <td className="py-2 pr-4 font-semibold text-foreground">
                            {formatMoney(fare.totalFare, fare.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2">
              {firstBaggage && (
                <span className="flex items-center gap-1 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-medium text-foreground">
                  <BaggageClaim className="size-3.5 text-brand" />
                  {firstBaggage.pieces != null
                    ? `${firstBaggage.pieces} bag${firstBaggage.pieces !== 1 ? "s" : ""} included`
                    : firstBaggage.weight != null
                      ? `${firstBaggage.weight}${firstBaggage.unit ?? "kg"} baggage`
                      : "Baggage included"}
                </span>
              )}
              {offer.seatsAvailable != null && offer.seatsAvailable <= 9 && (
                <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  <Armchair className="size-3.5" />
                  {offer.seatsAvailable} seat
                  {offer.seatsAvailable !== 1 ? "s" : ""} left
                </span>
              )}
              {offer.refundable === true && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <BadgeCheck className="size-3.5" />
                  Refundable
                </span>
              )}
              {offer.refundable === false && (
                <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                  <ShieldX className="size-3.5" />
                  Non-refundable
                </span>
              )}
              <span className="ml-auto text-xs text-muted">
                via {offer.provider}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
