"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Armchair,
  BaggageClaim,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock3,
  Moon,
  Plane,
  ReceiptText,
  ShieldX,
} from "lucide-react";

import type { FlightLeg, FlightOffer, TripType } from "@/lib/flights/types";
import {
  getAirlineCode,
  getAirlineLogoSrc,
} from "../../../lib/flights/airline-branding";
import { FlightInfoTooltip } from "@/components/features/flights/flight-info-tooltip";

type AirportLookupEntry = {
  iata: string;
  city: string;
  country: string;
  airportName: string;
};

type FlightResultCardProps = {
  offer: FlightOffer;
  tripType: TripType;
  defaultOpen?: boolean;
  highlighted?: boolean;
  onSelect?: () => void;
  airportLookup?: Record<string, AirportLookupEntry>;
  airlineLookup?: Record<string, string>;
};

export function FlightResultCardSkeleton() {
  return (
    <article className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div className="grid gap-4 p-4 md:grid-cols-[180px_minmax(0,1fr)_190px] md:items-center">
        <div className="flex items-center gap-4">
          <div className="skeleton h-16 w-16 shrink-0 rounded-full" />
          <div className="flex flex-col gap-4">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-28" />
          </div>
        </div>

        <div className="px-1 md:px-4">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
            <div className="space-y-3">
              <div className="skeleton h-8 w-20" />
              <div className="skeleton h-4 w-12" />
              <div className="skeleton h-3 w-24" />
            </div>

            <div className="space-y-3">
              <div className="mx-auto skeleton h-4 w-24" />
              <div className="skeleton h-2 w-full" />
              <div className="mx-auto skeleton h-3 w-32" />
            </div>

            <div className="space-y-3 text-right">
              <div className="ml-auto skeleton h-8 w-20" />
              <div className="ml-auto skeleton h-4 w-12" />
              <div className="ml-auto skeleton h-3 w-24" />
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-base-300 pt-3 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="flex flex-col gap-3 md:items-end">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-8 w-24" />
            <div className="skeleton h-4 w-20" />
          </div>
        </div>
      </div>

      <div className="border-t border-base-200 px-4 py-3 text-right">
        <div className="ml-auto skeleton h-4 w-24" />
      </div>
    </article>
  );
}

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

function getStopoverInfosForLeg(leg?: FlightLeg): StopoverInfo[] {
  if (!leg || leg.segments.length <= 1) return [];

  return leg.segments.slice(0, -1).map((seg, i) => {
    const nextSeg = leg.segments[i + 1];
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
  tripType,
  defaultOpen = false,
  highlighted = false,
  onSelect,
  airportLookup,
  airlineLookup,
}: FlightResultCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const airlineCode = getAirlineCode(offer.airline);
  const airlineName =
    airlineLookup?.[normalizeAirlineCode(offer.airline)] ?? offer.airline;
  const airlineLogoSrc = getAirlineLogoSrc(offer.airline, airlineName);

  const hasLegs = (offer.legs?.length ?? 0) > 0;
  const hasMultiSegment =
    offer.legs?.some((l) => l.segments.length > 1) ?? false;
  const hasFares = (offer.passengerFares?.length ?? 0) > 0;
  const firstBaggage = offer.passengerFares?.[0]?.baggage;
  const summaryLegs: FlightLeg[] =
    offer.legs && offer.legs.length > 0
      ? offer.legs
      : [
          {
            legIndex: 0,
            origin: offer.origin,
            destination: offer.destination,
            departure: offer.departure,
            arrival: offer.arrival,
            durationMinutes: offer.durationMinutes,
            stops: offer.stops,
            segments: [],
          },
        ];
  const isRoundTripOffer =
    tripType === "round-trip" && summaryLegs.length === 2;
  const isMultiCityOffer = tripType === "multi-city" && summaryLegs.length > 1;

  const PAX_LABEL: Record<string, string> = {
    ADT: "Adult",
    CNN: "Child",
    INF: "Infant",
  };

  function getLegLabel(index: number, totalLegs: number) {
    if (tripType === "round-trip" && totalLegs === 2) {
      return index === 0 ? "Outbound Flight" : "Return Flight";
    }

    if (tripType === "multi-city" && totalLegs > 1) {
      return `Leg ${index + 1}`;
    }

    return "";
  }

  function renderLegSummary(leg: FlightLeg, index: number) {
    const stopoverInfos = getStopoverInfosForLeg(leg);
    const dayOffset = getDayOffsetLabel(leg.departure, leg.arrival);
    const legOriginRef = airportLookup?.[normalizeAirportCode(leg.origin)];
    const legDestinationRef =
      airportLookup?.[normalizeAirportCode(leg.destination)];
    const legLabel = getLegLabel(index, summaryLegs.length);

    return (
      <div
        key={`${offer.id}-summary-leg-${leg.legIndex}`}
        className={
          index > 0 ? "border-t border-dashed border-base-300 pt-4" : ""
        }
      >
        {legLabel ? (
          <p className="mb-3 text-xs font-semibold text-muted">
            {legLabel}
          </p>
        ) : null}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
          <div>
            <p className="text-2xl font-bold leading-none tabular-nums text-foreground">
              {formatClockTime(leg.departure)}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {leg.origin}
            </p>
            <p className="mt-1 text-[11px] leading-tight text-muted">
              {legOriginRef?.city ?? leg.origin}
            </p>
          </div>

          <div>
            <p className="mb-2 flex items-center justify-center gap-1 text-sm text-muted">
              <Clock3 className="size-3.5" />
              {formatDuration(leg.durationMinutes)}
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-line bg-white" />
              <span className="relative h-0.5 flex-1 rounded-full bg-line">
                {stopoverInfos.slice(0, 2).map((stopover, stopIndex) => (
                  <span
                    key={`${offer.id}-stop-${leg.legIndex}-${stopover.airport}-${stopIndex}`}
                    className="group absolute top-1/2 h-3 w-3 -translate-y-1/2 cursor-default rounded-full border-2 border-brand bg-white"
                    style={{
                      left: `${((stopIndex + 1) * 100) / (stopoverInfos.length + 1)}%`,
                    }}
                  >
                    <FlightInfoTooltip className="bottom-full left-1/2 mb-2 -translate-x-1/2">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground">
                        {stopover.isOvernight ? (
                          <Moon className="size-3 text-indigo-500" />
                        ) : null}
                        {stopover.airport
                          ? `Stopover · ${stopover.airport}`
                          : "Stopover"}
                      </span>
                      {stopover.durationMinutes > 0 ? (
                        <span className="mt-0.5 block text-muted">
                          {formatDuration(stopover.durationMinutes)}
                          {stopover.isOvernight ? " · Overnight stay" : ""}
                        </span>
                      ) : null}
                    </FlightInfoTooltip>
                  </span>
                ))}
              </span>
              <span className="h-2.5 w-2.5 rounded-full border-2 border-line bg-white" />
            </div>
            <div className="mt-2 flex justify-center">
              {leg.stops === 0 ? (
                <span className="text-xs text-muted">Direct</span>
              ) : stopoverInfos.length > 0 ? (
                <span className="group relative inline-flex cursor-default">
                  <span className="text-xs text-muted underline decoration-dotted underline-offset-2">
                    {leg.stops} stop{leg.stops > 1 ? "s" : ""}
                    {` · ${stopoverInfos
                      .map((stop) => stop.airport)
                      .filter(Boolean)
                      .join(" • ")}`}
                  </span>
                  <FlightInfoTooltip className="bottom-full left-1/2 mb-2 -translate-x-1/2">
                    {stopoverInfos.map((stopover, stopIndex) => (
                      <span
                        key={`${offer.id}-stopover-detail-${leg.legIndex}-${stopIndex}`}
                        className={`block ${stopIndex > 0 ? "mt-2 border-t border-base-200 pt-2" : ""}`}
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          {stopover.isOvernight ? (
                            <Moon className="size-3 text-indigo-500" />
                          ) : null}
                          {stopover.airport
                            ? `Stopover · ${stopover.airport}`
                            : "Stopover"}
                        </span>
                        {stopover.durationMinutes > 0 ? (
                          <span className="mt-0.5 block text-muted">
                            {formatDuration(stopover.durationMinutes)}
                            {stopover.isOvernight ? " · Overnight stay" : ""}
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </FlightInfoTooltip>
                </span>
              ) : (
                <span className="text-xs text-muted">
                  {leg.stops} stop{leg.stops > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold leading-none tabular-nums text-foreground">
              {formatClockTime(leg.arrival)}
            </p>
            <div className="mt-2 inline-flex items-center justify-end gap-1 text-sm font-semibold">
              <span className="text-foreground">{leg.destination}</span>
              {dayOffset ? (
                <span className="group relative inline-flex cursor-default items-center gap-0.5 text-muted">
                  <span className="text-xs">{dayOffset}</span>
                  <Moon className="size-3.5" />
                  <FlightInfoTooltip className="bottom-full right-0 mb-2">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Moon className="size-3 text-indigo-500" />
                      Overnight Flight
                    </span>
                    <span className="mt-0.5 block text-muted">
                      Arrives{" "}
                      {parseInt(dayOffset, 10) > 1
                        ? `${dayOffset} days`
                        : "next day"}{" "}
                      after departure
                    </span>
                  </FlightInfoTooltip>
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] leading-tight text-muted">
              {legDestinationRef?.city ?? leg.destination}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article
      className={`cursor-pointer rounded-2xl border bg-white transition-shadow duration-200 hover:shadow-raised ${
        highlighted ? "border-brand ring-1 ring-brand" : "border-line"
      }`}
      onClick={onSelect}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:p-5 md:grid-cols-[170px_minmax(0,1fr)_180px] md:items-start">
        <div className="flex items-center gap-3 md:pt-2">
          {airlineLogoSrc ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white p-2">
              <Image
                src={airlineLogoSrc}
                alt={`${airlineName} logo`}
                className="h-full w-full object-contain"
                width={48}
                height={48}
                unoptimized
              />
            </div>
          ) : (
            <div className="rounded-full bg-brand-soft px-3 py-2 text-sm font-bold uppercase tracking-wide text-brand">
              {airlineCode}
            </div>
          )}
          <div>
            <p className="text-base font-medium text-foreground">
              {airlineName}
            </p>
            <p className="text-xs text-muted">
              {offer.flightNumber ?? "Flight"}
            </p>
          </div>
        </div>

        <div className="space-y-4 px-1 md:px-4">
          {summaryLegs.map((leg, index) => renderLegSummary(leg, index))}
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-line pt-3 md:flex-col md:items-end md:justify-start md:border-l md:border-t-0 md:pl-6 md:pt-1">
          <div className="md:text-right">
            <p className="text-2xl font-bold leading-none tabular-nums text-foreground">
              {formatMoney(offer.price, offer.currency)}
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {isMultiCityOffer
                ? "Multi-city total"
                : isRoundTripOffer
                  ? "Round-trip total"
                  : "Per person"}{" "}
              · incl. taxes &amp; fees
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 md:w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
              }}
              aria-pressed={highlighted}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition md:w-full ${
                highlighted
                  ? "bg-brand-soft text-brand"
                  : "bg-brand text-white hover:bg-brand-strong"
              }`}
            >
              {highlighted ? (
                <>
                  <Check className="size-4" />
                  Selected
                </>
              ) : (
                "Select"
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => !o);
              }}
              aria-expanded={open}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-strong"
            >
              Flight details
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Click-toggle detail panel ── */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-5 border-t border-line px-5 pb-5 pt-4">
            {/* Itinerary */}
            {hasLegs && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
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
                {offer.legs!.map((leg, legIndex) => (
                  <div key={leg.legIndex} className="space-y-2">
                    {getLegLabel(legIndex, offer.legs!.length) && (
                      <p className="text-xs font-medium text-muted">
                        {getLegLabel(legIndex, offer.legs!.length)} ·{" "}
                        {leg.origin} → {leg.destination}
                      </p>
                    )}
                    {leg.segments.map((seg) => (
                      <div
                        key={seg.segmentIndex}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-line bg-subtle px-4 py-3 text-sm"
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
                <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ReceiptText className="size-3.5" />
                  Fare breakdown
                </p>
                <div className="overflow-x-auto rounded-xl border border-base-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-base-200/70">
                        <th className="py-2 pl-4 pr-4 text-left text-xs font-semibold text-muted">
                          Passenger
                        </th>
                        <th className="py-2 pr-4 text-left text-xs font-semibold text-muted">
                          Base fare
                        </th>
                        <th className="py-2 pr-4 text-left text-xs font-semibold text-muted">
                          Taxes
                        </th>
                        <th className="py-2 pr-4 text-left text-xs font-semibold text-muted">
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
                <span className="flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-foreground">
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
