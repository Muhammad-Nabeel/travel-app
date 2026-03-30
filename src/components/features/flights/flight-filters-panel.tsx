"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";

type StopsFilter = "all" | "direct" | "one-plus";

type FlightFiltersPanelProps = {
  maxPrice: number;
  priceCap: number;
  currency: string;
  stopsFilter: StopsFilter;
  selectedAirlines: string[];
  uniqueAirlines: string[];
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
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-content/50">
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
  onPriceCapChange,
  onStopsFilterChange,
  onAirlinesChange,
  onReset,
}: FlightFiltersPanelProps) {
  return (
    <aside className="card bg-base-100 shadow-sm">
      <div className="card-body gap-0 p-4">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-base-content">
            <SlidersHorizontal className="size-4 text-primary" />
            Filters
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1 text-primary"
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
              className="range range-xs range-primary w-full"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-base-content/60">
              <span>{formatMoney(0, currency)}</span>
              <span className="font-semibold text-base-content">
                {formatMoney(Math.min(priceCap, maxPrice), currency)}
              </span>
              <span>{formatMoney(maxPrice, currency)}</span>
            </div>
          </FilterSection>

          <div className="divider my-0" />

          {/* Stops */}
          <FilterSection title="Stops">
            <div className="flex flex-col gap-1.5">
              {STOPS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-base-200"
                >
                  <input
                    type="radio"
                    name="stops-filter"
                    className="radio radio-xs radio-primary"
                    checked={stopsFilter === opt.value}
                    onChange={() => onStopsFilterChange(opt.value)}
                  />
                  <span className="text-sm text-base-content">{opt.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Airlines — only shown when there are multiple */}
          {uniqueAirlines.length > 1 && (
            <>
              <div className="divider my-0" />
              <FilterSection title="Airlines">
                <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                  {uniqueAirlines.map((airline) => {
                    const checked = selectedAirlines.includes(airline);
                    return (
                      <label
                        key={airline}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-base-200"
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs checkbox-primary"
                          checked={checked}
                          onChange={(e) => {
                            onAirlinesChange(
                              e.target.checked
                                ? [...selectedAirlines, airline]
                                : selectedAirlines.filter((a) => a !== airline),
                            );
                          }}
                        />
                        <span className="text-sm text-base-content">
                          {airline}
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
