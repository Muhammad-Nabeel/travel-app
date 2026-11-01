"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, TrendingDown } from "lucide-react";

import { useLiveFaresEnabled } from "@/components/shared/live-fares-provider";
import type { FlightSearchQuery } from "@/lib/flights/types";

type FareCalendarStripProps = {
  query: FlightSearchQuery;
};

type FareEntry = {
  date: string;
  amount: number;
  currency: string;
};

type DailyFare = {
  date: string;
  amount: number | null;
  currency: string | null;
};

function formatDateLabel(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toIsoDateOrFallback(value: string | undefined, fallback: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return fallback;
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getStayDays(query: FlightSearchQuery) {
  if (query.tripType !== "round-trip" || !query.returnDate) return null;
  const dep = Date.parse(`${query.departureDate}T00:00:00.000Z`);
  const ret = Date.parse(`${query.returnDate}T00:00:00.000Z`);
  if (!Number.isFinite(dep) || !Number.isFinite(ret)) return null;
  const diff = Math.round((ret - dep) / 86_400_000);
  return diff > 0 ? diff : null;
}

function getSearchHref(query: FlightSearchQuery, departureDate: string) {
  const params = new URLSearchParams({
    tripType: query.tripType,
    origin: query.origin,
    destination: query.destination,
    departureDate,
    adults: String(query.adults),
    children: String(query.children),
    infants: String(query.infants),
    cabinClass: query.cabinClass,
    directOnly: String(query.directOnly),
    currency: query.currency,
  });

  const stayDays = getStayDays(query);
  if (query.tripType === "round-trip" && stayDays) {
    params.set("returnDate", addDays(departureDate, stayDays));
  } else if (query.returnDate) {
    params.set("returnDate", query.returnDate);
  }

  if (query.tripType === "multi-city" && (query.legs?.length ?? 0) > 0) {
    params.set("legs", JSON.stringify(query.legs));
  }

  return `/flights?${params.toString()}`;
}

function buildCenteredWeek(selectedDate: string, fares: FareEntry[]) {
  const lookup = new Map(fares.map((fare) => [fare.date, fare]));
  return Array.from<unknown, DailyFare>({ length: 7 }, (_, index) => {
    const date = addDays(selectedDate, index - 3);
    const match = lookup.get(date);
    return {
      date,
      amount: match?.amount ?? null,
      currency: match?.currency ?? null,
    };
  });
}

export function FareCalendarStripSkeleton() {
  return (
    <section className="section-shell mt-5" aria-hidden>
      <div className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="skeleton h-4 w-28" />
          <div className="mt-2 skeleton h-3 w-36" />
          <div className="mt-2 skeleton h-8 w-24" />
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            {Array.from({ length: 7 }, (_, index) => (
              <div
                key={`fare-calendar-skeleton-${index}`}
                className="w-32 rounded-xl border border-line bg-white px-3 py-2.5"
              >
                <div className="skeleton h-3 w-20" />
                <div className="mt-2 skeleton h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FareCalendarStrip({ query }: FareCalendarStripProps) {
  const liveFaresEnabled = useLiveFaresEnabled();
  const [fares, setFares] = useState<FareEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query.tripType === "multi-city" || !liveFaresEnabled) {
      return;
    }

    const tripType = query.tripType === "round-trip" ? "round-trip" : "one-way";
    const selectedDate = toIsoDateOrFallback(
      query.departureDate,
      new Date().toISOString().slice(0, 10),
    );
    const monthAnchor = addDays(selectedDate, -3);

    const params = new URLSearchParams({
      origin: query.origin,
      destination: query.destination,
      departureDate: query.departureDate,
      month: monthAnchor,
      tripType,
      cabinClass: query.cabinClass,
      months: "1",
      currency: query.currency,
    });

    if (query.returnDate) {
      params.set("returnDate", query.returnDate);
    }

    const controller = new AbortController();

    async function loadFares() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/fare-calendar?${params.toString()}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          ok?: boolean;
          fares?: FareEntry[];
        };
        setFares(
          data.ok && data.fares && data.fares.length > 0 ? data.fares : null,
        );
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          setFares(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadFares();

    return () => {
      controller.abort();
    };
  }, [
    liveFaresEnabled,
    query.tripType,
    query.origin,
    query.destination,
    query.departureDate,
    query.returnDate,
    query.cabinClass,
  ]);

  if (query.tripType === "multi-city" || !liveFaresEnabled) return null;
  if (loading) return <FareCalendarStripSkeleton />;
  if (!fares || fares.length === 0) return null;

  const selectedDate = toIsoDateOrFallback(
    query.departureDate,
    new Date().toISOString().slice(0, 10),
  );
  const sorted = [...fares].sort((a, b) => a.date.localeCompare(b.date));
  const centeredWeek = buildCenteredWeek(selectedDate, sorted);
  const availableInWeek = centeredWeek.filter(
    (fare): fare is DailyFare & { amount: number; currency: string } =>
      fare.amount !== null && fare.currency !== null,
  );

  const lowestInStrip =
    availableInWeek.length > 0
      ? Math.min(...availableInWeek.map((fare) => fare.amount))
      : null;
  const absoluteLowest = Math.min(...sorted.map((fare) => fare.amount));
  const absoluteLowestCurrency =
    sorted.find((fare) => fare.amount === absoluteLowest)?.currency ??
    availableInWeek[0]?.currency ??
    "USD";

  return (
    <section className="section-shell mt-5">
      <div className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingDown className="size-4 text-success" />
            Lowest price found
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatMoney(absoluteLowest, absoluteLowestCurrency)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            {centeredWeek.map((fare) => {
              const isSelected = fare.date === selectedDate;
              const isLowest =
                lowestInStrip !== null &&
                fare.amount !== null &&
                fare.amount === lowestInStrip;
              const href = getSearchHref(query, fare.date);

              if (fare.amount === null || fare.currency === null) {
                return (
                  <div
                    key={fare.date}
                    className={[
                      "w-32 rounded-xl border px-3 py-2.5 text-left",
                      isSelected
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-subtle",
                    ].join(" ")}
                  >
                    <p className="flex items-center gap-1 text-xs font-medium text-muted">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDateLabel(fare.date)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">
                      <span aria-hidden>—</span>
                      <span className="sr-only">No fare</span>
                    </p>
                  </div>
                );
              }

              return (
                <Link
                  key={fare.date}
                  href={href}
                  className={[
                    "w-32 rounded-xl border px-3 py-2.5 text-left transition",
                    isSelected
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-white hover:border-foreground/40",
                  ].join(" ")}
                  prefetch={false}
                >
                  <p className="flex items-center gap-1 text-xs font-medium text-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateLabel(fare.date)}
                  </p>
                  <p
                    className={[
                      "mt-1 text-base font-bold leading-tight tabular-nums",
                      isLowest ? "text-success" : "text-foreground",
                    ].join(" ")}
                  >
                    {formatMoney(fare.amount, fare.currency)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
