"use client";

import Image from "next/image";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import {
  getAirlineCode,
  getAirlineLogoSrc,
} from "../../../lib/flights/airline-branding";

type StopsFilter = "all" | "direct" | "one-plus";

type FlightFiltersPanelProps = {
  maxPrice: number;
  priceCap: number;
  currency: string;
  stopsFilter: StopsFilter;
  selectedAirlines: string[];
  uniqueAirlines: string[];
  airlineLookup?: Record<string, string>;
  onPriceCapChange: (value: number) => void;
  onStopsFilterChange: (value: StopsFilter) => void;
  onAirlinesChange: (value: string[]) => void;
  onReset: () => void;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

const STOPS_OPTIONS: { value: StopsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "direct", label: "Direct only" },
  { value: "one-plus", label: "1+ stop" },
];

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function FlightFiltersPanel({
  maxPrice,
  priceCap,
  currency,
  stopsFilter,
  selectedAirlines,
  uniqueAirlines,
  airlineLookup,
  onPriceCapChange,
  onStopsFilterChange,
  onAirlinesChange,
  onReset,
}: FlightFiltersPanelProps) {
  return (
    <aside className="rounded-2xl border border-line bg-white">
      <div className="p-5">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <SlidersHorizontal className="size-4 text-brand" />
            Filters
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-brand transition hover:bg-brand-soft"
            onClick={onReset}
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>

        <div className="space-y-5">
          {/* Price ceiling */}
          <FilterSection title="Max price">
            <input
              type="range"
              min={0}
              max={maxPrice}
              step={Math.max(1, Math.round(maxPrice / 100))}
              value={Math.min(priceCap, maxPrice)}
              onChange={(e) => onPriceCapChange(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{formatMoney(0, currency)}</span>
              <span className="font-semibold text-foreground">
                {formatMoney(Math.min(priceCap, maxPrice), currency)}
              </span>
              <span>{formatMoney(maxPrice, currency)}</span>
            </div>
          </FilterSection>

          <div className="border-t border-line" />

          {/* Stops */}
          <FilterSection title="Stops">
            <div className="flex flex-col gap-1.5">
              {STOPS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-subtle"
                >
                  <input
                    type="radio"
                    name="stops-filter"
                    className="size-4 accent-[var(--primary)]"
                    checked={stopsFilter === opt.value}
                    onChange={() => onStopsFilterChange(opt.value)}
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Airlines — only shown when there are multiple */}
          {uniqueAirlines.length > 1 && (
            <>
              <div className="border-t border-line" />
              <FilterSection title="Airlines">
                <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                  {uniqueAirlines.map((airline) => {
                    const checked = selectedAirlines.includes(airline);
                    const airlineCode = getAirlineCode(airline);
                    const airlineName = airlineLookup?.[airlineCode] ?? airline;
                    const airlineLogoSrc = getAirlineLogoSrc(
                      airline,
                      airlineName,
                    );
                    return (
                      <label
                        key={airline}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-subtle"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded accent-[var(--primary)]"
                          checked={checked}
                          onChange={(e) => {
                            onAirlinesChange(
                              e.target.checked
                                ? [...selectedAirlines, airline]
                                : selectedAirlines.filter((a) => a !== airline),
                            );
                          }}
                        />
                        {airlineLogoSrc ? (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white p-1">
                            <Image
                              src={airlineLogoSrc}
                              alt={`${airlineName} logo`}
                              className="h-full w-full object-contain"
                              width={24}
                              height={24}
                            />
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[10px] font-bold uppercase text-brand">
                            {airlineCode}
                          </div>
                        )}
                        <span className="text-sm text-foreground">
                          {airlineName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </FilterSection>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
