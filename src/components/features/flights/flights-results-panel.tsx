"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, Plane } from "lucide-react";

import { FlightFiltersPanel } from "@/components/features/flights/flight-filters-panel";
import { FlightResultCard } from "@/components/features/flights/flight-result-card";
import type { FlightOffer, FlightSearchQuery } from "@/lib/flights/types";
import {
  getAirlineCode,
  getAirlineLogoSrc,
} from "@/lib/flights/airline-branding";

type FlightsResultsPanelProps = {
  offers: FlightOffer[];
  query: FlightSearchQuery;
  source: "sabre" | "amadeus" | "mock";
  warnings: string[];
};

type SortBy = "recommended" | "lowest-price" | "shortest-duration" | "earliest";

type AirportLookupEntry = {
  iata: string;
  city: string;
  country: string;
  airportName: string;
};

export function FlightsResultsPanel({
  offers,
  query,
  warnings,
}: FlightsResultsPanelProps) {
  const PAGE_SIZE = 10;
  const isRoundTrip = query.tripType === "round-trip";
  const router = useRouter();

  function buildBookingUrl(offerId: string) {
    const p = new URLSearchParams({
      offerId,
      tripType: query.tripType,
      origin: query.origin,
      destination: query.destination,
      departureDate: query.departureDate,
      adults: String(query.adults),
      children: String(query.children),
      infants: String(query.infants),
      cabinClass: query.cabinClass,
      directOnly: String(query.directOnly),
    });
    if (query.returnDate) p.set("returnDate", query.returnDate);
    return `/flights/booking?${p.toString()}`;
  }

  const [sortBy, setSortBy] = useState<SortBy>("lowest-price");
  const [stopsFilter, setStopsFilter] = useState<"all" | "direct" | "one-plus">(
    query.directOnly ? "direct" : "all",
  );
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(
    offers[0]?.id ?? null,
  );
  const [airportLookup, setAirportLookup] = useState<
    Record<string, AirportLookupEntry>
  >({});
  const [airlineLookup, setAirlineLookup] = useState<Record<string, string>>(
    {},
  );

  const maxPrice = useMemo(() => {
    if (offers.length === 0) {
      return 1000;
    }
    return Math.max(...offers.map((offer) => offer.price));
  }, [offers]);

  const [priceCap, setPriceCap] = useState<number>(maxPrice);
  const effectivePriceCap = Math.min(priceCap, maxPrice);

  const uniqueAirlines = useMemo(
    () => Array.from(new Set(offers.map((offer) => offer.airline))).sort(),
    [offers],
  );

  function getOfferDuration(offer: FlightOffer) {
    if (offer.legs && offer.legs.length > 0) {
      return offer.legs.reduce(
        (total, leg) => total + (leg.durationMinutes ?? 0),
        0,
      );
    }

    return offer.durationMinutes ?? Number.MAX_SAFE_INTEGER;
  }

  const filteredOffers = useMemo(() => {
    const narrowed = offers.filter((offer) => {
      if (offer.price > effectivePriceCap) {
        return false;
      }

      if (stopsFilter === "direct" && offer.stops > 0) {
        return false;
      }

      if (stopsFilter === "one-plus" && offer.stops === 0) {
        return false;
      }

      if (
        selectedAirlines.length > 0 &&
        !selectedAirlines.includes(offer.airline)
      ) {
        return false;
      }

      return true;
    });

    const sorted = [...narrowed].sort((a, b) => a.price - b.price);
    if (sortBy === "lowest-price") {
      // already sorted above — lowest price is the default
    }

    if (sortBy === "shortest-duration") {
      sorted.sort((a, b) => getOfferDuration(a) - getOfferDuration(b));
    }

    if (sortBy === "earliest") {
      sorted.sort(
        (a, b) =>
          new Date(a.departure).getTime() - new Date(b.departure).getTime(),
      );
    }

    return sorted;
  }, [effectivePriceCap, offers, selectedAirlines, sortBy, stopsFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / PAGE_SIZE));
  const pagedOffers = useMemo(
    () => filteredOffers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredOffers, page],
  );

  useEffect(() => {
    if (pagedOffers.length === 0) {
      return;
    }

    const airportCodes = Array.from(
      new Set(
        pagedOffers
          .flatMap((offer) =>
            offer.legs && offer.legs.length > 0
              ? offer.legs.flatMap((leg) => [leg.origin, leg.destination])
              : [offer.origin, offer.destination],
          )
          .map((c) => c.trim().toUpperCase().slice(0, 3))
          .filter(Boolean),
      ),
    );

    const airlineCodes = Array.from(
      new Set(
        pagedOffers
          .flatMap((offer) =>
            offer.legs && offer.legs.length > 0
              ? offer.legs.flatMap((leg) =>
                  leg.segments.length > 0
                    ? leg.segments.map((segment) => segment.airline)
                    : [offer.airline],
                )
              : [offer.airline],
          )
          .map((code) => code.trim().toUpperCase().slice(0, 3))
          .filter((c) => c.length >= 2),
      ),
    );

    const params = new URLSearchParams();
    if (airportCodes.length > 0) params.set("airports", airportCodes.join(","));
    if (airlineCodes.length > 0) params.set("airlines", airlineCodes.join(","));

    let cancelled = false;

    fetch(`/api/aviation/lookup?${params.toString()}`, {
      cache: "force-cache",
    })
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("lookup failed")),
      )
      .then((data) => {
        if (cancelled) return;
        setAirportLookup(data.airports ?? {});
        setAirlineLookup(data.airlines ?? {});
      })
      .catch(() => {
        if (cancelled) return;
        setAirportLookup({});
        setAirlineLookup({});
      });

    return () => {
      cancelled = true;
    };
  }, [pagedOffers]);

  const resolvedSelectedOfferId = pagedOffers.some(
    (offer) => offer.id === selectedOfferId,
  )
    ? selectedOfferId
    : (pagedOffers[0]?.id ?? null);

  const selectedOffer =
    pagedOffers.find((offer) => offer.id === resolvedSelectedOfferId) ??
    pagedOffers[0] ??
    null;

  const currency = offers[0]?.currency ?? "PKR";

  const quickSortMeta = useMemo(() => {
    if (filteredOffers.length === 0) return null;
    const cheapest = [...filteredOffers].sort((a, b) => a.price - b.price)[0];
    const fastest = [...filteredOffers].sort(
      (a, b) => getOfferDuration(a) - getOfferDuration(b),
    )[0];
    const earliest = [...filteredOffers].sort(
      (a, b) =>
        new Date(a.departure).getTime() - new Date(b.departure).getTime(),
    )[0];
    return { cheapest, fastest, earliest };
  }, [filteredOffers]);

  function formatQuickPrice(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatMoney(value: number, curr: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatTime(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsed);
  }

  function formatDuration(minutes?: number) {
    if (!minutes) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <section className="section-shell mt-6 pb-40">
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="space-y-4">
          <aside className="surface ring-soft rounded-2xl border border-white/70 p-4">
            <div className="mt-3 rounded-xl border border-base-300 bg-base-200/40 px-3 py-2">
              <p className="text-xs uppercase tracking-widest text-base-content/50">
                Total flights found
              </p>
              <p className="mt-1 text-base font-semibold text-base-content">
                {filteredOffers.length}
              </p>
            </div>
          </aside>

          <FlightFiltersPanel
            maxPrice={maxPrice}
            priceCap={effectivePriceCap}
            currency={offers[0]?.currency ?? "USD"}
            stopsFilter={stopsFilter}
            selectedAirlines={selectedAirlines}
            uniqueAirlines={uniqueAirlines}
            airlineLookup={airlineLookup}
            onPriceCapChange={(v) => {
              setPriceCap(v);
              setPage(1);
            }}
            onStopsFilterChange={(v) => {
              setStopsFilter(v);
              setPage(1);
            }}
            onAirlinesChange={(v) => {
              setSelectedAirlines(v);
              setPage(1);
            }}
            onReset={() => {
              setStopsFilter("all");
              setSelectedAirlines([]);
              setPriceCap(maxPrice);
              setSortBy("lowest-price");
              setPage(1);
            }}
          />
        </div>

        <div className="space-y-4">
          {warnings.length > 0 ? (
            <div className="alert alert-warning bg-amber-50 text-amber-900">
              <span>{warnings[0]}</span>
            </div>
          ) : null}

          {/* ── Quick-sort tab bar ── */}
          {quickSortMeta && (
            <div className="surface ring-soft overflow-hidden rounded-2xl border border-white/70">
              <div className="grid grid-cols-2 divide-x divide-base-200 sm:grid-cols-4">
                {(
                  [
                    {
                      key: "recommended",
                      label: "Recommended",
                      price: quickSortMeta.cheapest.price,
                    },
                    {
                      key: "lowest-price",
                      label: "Cheapest",
                      price: quickSortMeta.cheapest.price,
                    },
                    {
                      key: "shortest-duration",
                      label: "Fastest",
                      price: quickSortMeta.fastest.price,
                    },
                    {
                      key: "earliest",
                      label: "Sort By Departure Time",
                      price: quickSortMeta.earliest.price,
                    },
                  ] as { key: SortBy; label: string; price: number }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setSortBy(tab.key);
                      setPage(1);
                    }}
                    className={`flex flex-col gap-1 px-4 py-3 text-left transition-colors ${
                      sortBy === tab.key
                        ? "bg-neutral text-neutral-content"
                        : "bg-base-100/60 text-base-content/70 hover:bg-base-200/60"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        sortBy === tab.key
                          ? "text-neutral-content"
                          : "text-foreground"
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span className="text-xs font-medium opacity-70">
                      {formatQuickPrice(tab.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredOffers.length === 0 ? (
            <div className="surface ring-soft rounded-3xl border border-white/70 p-8 text-center">
              <p className="font-medium text-foreground">
                No fares match your filters.
              </p>
              <p className="mt-2 text-sm text-muted">
                Adjust filters or run another search above.
              </p>
            </div>
          ) : (
            <>
              {pagedOffers.map((offer) => (
                <FlightResultCard
                  key={offer.id}
                  offer={offer}
                  highlighted={resolvedSelectedOfferId === offer.id}
                  onSelect={() => setSelectedOfferId(offer.id)}
                  airportLookup={airportLookup}
                  airlineLookup={airlineLookup}
                />
              ))}

              {totalPages > 1 && (
                <div className="surface ring-soft flex items-center justify-between rounded-3xl border border-white/70 px-5 py-3">
                  <p className="text-sm text-muted">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filteredOffers.length)} of{" "}
                    {filteredOffers.length}
                  </p>
                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      «
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          className={`join-item btn btn-sm ${
                            p === page ? "btn-primary" : ""
                          }`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      className="join-item btn btn-sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedOffer && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/97 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <div className="mx-auto w-full max-w-295 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
              {/* ── Outbound leg pill ── */}
              <StickyLegPill
                label="Outbound Flight"
                leg={
                  selectedOffer.legs?.[0] ?? {
                    legIndex: 0,
                    origin: selectedOffer.origin,
                    destination: selectedOffer.destination,
                    departure: selectedOffer.departure,
                    arrival: selectedOffer.arrival,
                    durationMinutes: selectedOffer.durationMinutes,
                    stops: selectedOffer.stops,
                    segments: [],
                  }
                }
                airline={selectedOffer.airline}
                airlineLookup={airlineLookup}
                formatTime={formatTime}
                formatDuration={formatDuration}
              />

              {/* ── Return leg pill ── */}
              {isRoundTrip && selectedOffer.legs?.[1] && (
                <>
                  <div className="hidden w-px self-stretch bg-base-300 sm:block" />
                  <StickyLegPill
                    label="Return Flight"
                    leg={selectedOffer.legs[1]}
                    airline={selectedOffer.airline}
                    airlineLookup={airlineLookup}
                    formatTime={formatTime}
                    formatDuration={formatDuration}
                  />
                </>
              )}

              {/* ── Price + Book CTA ── */}
              <div className="flex shrink-0 items-center gap-3 border-t border-base-300 pt-3 sm:ml-auto sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                    {isRoundTrip ? "Round-trip total" : "Per person"}
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">
                    {formatMoney(selectedOffer.price, selectedOffer.currency)}
                  </p>
                  <p className="text-[11px] text-muted">
                    Taxes &amp; fees incl.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary min-w-[96px] rounded-xl shadow-sm"
                  onClick={() => router.push(buildBookingUrl(selectedOffer.id))}
                >
                  Book now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Sticky leg pill sub-component ────────────────────────────────────────────

type StickyLegPillProps = {
  label: string;
  leg: {
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    durationMinutes?: number;
    stops: number;
    segments: Array<{ airline?: string }>;
  };
  airline: string;
  airlineLookup: Record<string, string>;
  formatTime: (v: string) => string;
  formatDuration: (minutes?: number) => string;
};

function formatShortDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(d);
}

function StickyLegPill({
  label,
  leg,
  airline,
  airlineLookup,
  formatTime,
  formatDuration,
}: StickyLegPillProps) {
  // Pick the marketing airline from first segment if available
  const marketingAirlineCode =
    (leg.segments[0] as { airline?: string } | undefined)?.airline ?? airline;
  const airlineName =
    airlineLookup?.[marketingAirlineCode.trim().toUpperCase().slice(0, 3)] ??
    marketingAirlineCode;
  const logoSrc = getAirlineLogoSrc(marketingAirlineCode, airline);
  const code = getAirlineCode(marketingAirlineCode, airline);

  const stopsLabel =
    leg.stops === 0 ? "Direct" : `${leg.stops} stop${leg.stops > 1 ? "s" : ""}`;

  const isMultiStop = leg.stops > 0;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {/* Airline badge */}
      <div className="shrink-0">
        {logoSrc ? (
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-base-200 bg-white p-1.5 shadow-sm">
            <Image
              src={logoSrc}
              alt={airlineName}
              className="h-full w-full object-contain"
              width={40}
              height={40}
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
            {code.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Route block */}
      <div className="min-w-0 flex-1">
        {/* Label row */}
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-base-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
            {label === "Outbound Flight" ? (
              <Plane className="size-2.5 rotate-0" />
            ) : (
              <Plane className="size-2.5 -scale-x-100" />
            )}
            {label}
          </span>
          <span className="text-[11px] text-muted">{airlineName}</span>
        </div>

        {/* Main info row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {/* Departure */}
          <span className="text-base font-bold text-foreground leading-none">
            {formatTime(leg.departure)}
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-muted" />
          {/* Arrival */}
          <span className="text-base font-bold text-foreground leading-none">
            {formatTime(leg.arrival)}
          </span>
          {/* Route */}
          <span className="rounded bg-base-200 px-1.5 py-0.5 text-xs font-semibold text-base-content/70">
            {leg.origin} → {leg.destination}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Clock3 className="size-3" />
            {formatDuration(leg.durationMinutes)}
          </span>
          <span
            className={`flex items-center gap-1 ${
              isMultiStop
                ? "font-medium text-amber-600"
                : "text-emerald-600 font-medium"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isMultiStop ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            {stopsLabel}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {formatShortDate(leg.departure)}
          </span>
        </div>
      </div>
    </div>
  );
}
