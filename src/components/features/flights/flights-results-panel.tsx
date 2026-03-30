"use client";

import { useEffect, useMemo, useState } from "react";

import { FlightFiltersPanel } from "@/components/features/flights/flight-filters-panel";
import { FlightResultCard } from "@/components/features/flights/flight-result-card";
import type { FlightOffer, FlightSearchQuery } from "@/lib/flights/types";

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

  const uniqueAirlines = useMemo(
    () => Array.from(new Set(offers.map((offer) => offer.airline))).sort(),
    [offers],
  );

  const filteredOffers = useMemo(() => {
    const narrowed = offers.filter((offer) => {
      if (offer.price > priceCap) {
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
      sorted.sort(
        (a, b) =>
          (a.durationMinutes ?? Number.MAX_SAFE_INTEGER) -
          (b.durationMinutes ?? Number.MAX_SAFE_INTEGER),
      );
    }

    if (sortBy === "earliest") {
      sorted.sort(
        (a, b) =>
          new Date(a.departure).getTime() - new Date(b.departure).getTime(),
      );
    }

    return sorted;
  }, [offers, priceCap, selectedAirlines, sortBy, stopsFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / PAGE_SIZE));
  const pagedOffers = filteredOffers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    if (pagedOffers.length === 0) {
      setAirportLookup({});
      setAirlineLookup({});
      return;
    }

    const airportCodes = Array.from(
      new Set(
        pagedOffers
          .flatMap((offer) => [offer.origin, offer.destination])
          .map((c) => c.trim().toUpperCase().slice(0, 3))
          .filter(Boolean),
      ),
    );

    const airlineCodes = Array.from(
      new Set(
        pagedOffers
          .map((offer) => offer.airline.trim().toUpperCase().slice(0, 3))
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

  useEffect(() => {
    if (pagedOffers.length === 0) {
      setSelectedOfferId(null);
      return;
    }

    const existsOnPage = pagedOffers.some(
      (offer) => offer.id === selectedOfferId,
    );
    if (!existsOnPage) {
      setSelectedOfferId(pagedOffers[0].id);
    }
  }, [pagedOffers, selectedOfferId]);

  const selectedOffer =
    pagedOffers.find((offer) => offer.id === selectedOfferId) ??
    pagedOffers[0] ??
    null;

  const currency = offers[0]?.currency ?? "PKR";

  const quickSortMeta = useMemo(() => {
    if (filteredOffers.length === 0) return null;
    const cheapest = [...filteredOffers].sort((a, b) => a.price - b.price)[0];
    const fastest = [...filteredOffers].sort(
      (a, b) =>
        (a.durationMinutes ?? Number.MAX_SAFE_INTEGER) -
        (b.durationMinutes ?? Number.MAX_SAFE_INTEGER),
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

  return (
    <section className="section-shell mt-6 pb-40">
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="space-y-4">
          <aside className="surface ring-soft rounded-2xl border border-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Flight Search
            </p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">
              {query.origin}
              {" -> "}
              {query.destination}
            </p>
            <p className="mt-1 text-xs text-muted">{query.departureDate}</p>
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
            priceCap={priceCap}
            currency={offers[0]?.currency ?? "USD"}
            stopsFilter={stopsFilter}
            selectedAirlines={selectedAirlines}
            uniqueAirlines={uniqueAirlines}
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
                  highlighted={selectedOffer?.id === offer.id}
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-295 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Selected Flight
              </p>
              <p className="text-sm font-semibold text-foreground sm:text-base">
                {selectedOffer.airline} · {selectedOffer.origin}
                {" -> "}
                {selectedOffer.destination}
              </p>
              <p className="text-xs text-muted sm:text-sm">
                {formatTime(selectedOffer.departure)}
                {" -> "}
                {formatTime(selectedOffer.arrival)} ·{" "}
                {selectedOffer.stops === 0
                  ? "Direct"
                  : `${selectedOffer.stops} stop${selectedOffer.stops > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                {formatMoney(selectedOffer.price, selectedOffer.currency)}
              </p>
              <button type="button" className="btn btn-primary">
                Book now
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
