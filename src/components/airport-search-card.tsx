"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type AirportOption = {
  iata: string;
  city: string;
  country: string;
  name: string;
};

type AirportLookupState = {
  query: string;
  results: AirportOption[];
  loading: boolean;
  selected: AirportOption | null;
};

const emptyLookupState: AirportLookupState = {
  query: "",
  results: [],
  loading: false,
  selected: null,
};

async function fetchAirportResults(query: string): Promise<AirportOption[]> {
  const response = await fetch(
    `/api/places/airports?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { results?: AirportOption[] };
  return payload.results ?? [];
}

export function AirportSearchCard() {
  const router = useRouter();
  const [fromState, setFromState] =
    useState<AirportLookupState>(emptyLookupState);
  const [toState, setToState] = useState<AirportLookupState>(emptyLookupState);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);

  const canSearch = Boolean(fromState.selected && toState.selected);

  const helperLabel = useMemo(() => {
    if (!fromState.selected && !toState.selected) {
      return "Search by city or airport, for example Karachi, Lahore, Jeddah or DXB.";
    }

    if (!fromState.selected || !toState.selected) {
      return "Pick both origin and destination to continue.";
    }

    return "Route selected. Continue to flights search results.";
  }, [fromState.selected, toState.selected]);

  async function handleQueryChange(field: "from" | "to", nextValue: string) {
    const trimmed = nextValue.trimStart();

    if (field === "from") {
      setFromState((current) => ({
        ...current,
        query: nextValue,
        selected:
          current.selected &&
          `${current.selected.city} (${current.selected.iata})` === nextValue
            ? current.selected
            : null,
        loading: trimmed.length >= 2,
      }));
    } else {
      setToState((current) => ({
        ...current,
        query: nextValue,
        selected:
          current.selected &&
          `${current.selected.city} (${current.selected.iata})` === nextValue
            ? current.selected
            : null,
        loading: trimmed.length >= 2,
      }));
    }

    if (trimmed.length < 2) {
      if (field === "from") {
        setFromState((current) => ({
          ...current,
          results: [],
          loading: false,
        }));
      } else {
        setToState((current) => ({ ...current, results: [], loading: false }));
      }
      return;
    }

    const results = await fetchAirportResults(trimmed);
    if (field === "from") {
      setFromState((current) => ({ ...current, results, loading: false }));
    } else {
      setToState((current) => ({ ...current, results, loading: false }));
    }
  }

  function selectAirport(field: "from" | "to", airport: AirportOption) {
    const value = `${airport.city} (${airport.iata})`;
    if (field === "from") {
      setFromState({
        query: value,
        loading: false,
        results: [],
        selected: airport,
      });
    } else {
      setToState({
        query: value,
        loading: false,
        results: [],
        selected: airport,
      });
    }
    setActiveField(null);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fromState.selected || !toState.selected) {
      return;
    }

    const params = new URLSearchParams({
      origin: fromState.selected.iata,
      destination: toState.selected.iata,
      originCity: fromState.selected.city,
      destinationCity: toState.selected.city,
    });

    router.push(`/flights?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submitSearch}
      className="home-search-card rounded-2xl p-4 shadow-2xl sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-white">
          Flights
        </span>
        <span className="rounded-full bg-white px-3 py-1">Hotels</span>
        <span className="rounded-full bg-white px-3 py-1">Car Rental</span>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <div className="relative">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            From city / airport
          </label>
          <input
            value={fromState.query}
            onFocus={() => setActiveField("from")}
            onChange={(event) =>
              void handleQueryChange("from", event.target.value)
            }
            placeholder="Karachi"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
          />
          {activeField === "from" &&
          (fromState.results.length > 0 || fromState.loading) ? (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {fromState.loading ? (
                <p className="px-2 py-3 text-sm text-slate-500">
                  Searching airports...
                </p>
              ) : (
                fromState.results.map((airport) => (
                  <button
                    key={`from-${airport.iata}`}
                    type="button"
                    onClick={() => selectAirport("from", airport)}
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {airport.city} ({airport.iata})
                    </p>
                    <p className="text-xs text-slate-500">
                      {airport.name} · {airport.country}
                    </p>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="relative">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            To city / airport
          </label>
          <input
            value={toState.query}
            onFocus={() => setActiveField("to")}
            onChange={(event) =>
              void handleQueryChange("to", event.target.value)
            }
            placeholder="Jeddah"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
          />
          {activeField === "to" &&
          (toState.results.length > 0 || toState.loading) ? (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {toState.loading ? (
                <p className="px-2 py-3 text-sm text-slate-500">
                  Searching airports...
                </p>
              ) : (
                toState.results.map((airport) => (
                  <button
                    key={`to-${airport.iata}`}
                    type="button"
                    onClick={() => selectAirport("to", airport)}
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {airport.city} ({airport.iata})
                    </p>
                    <p className="text-xs text-slate-500">
                      {airport.name} · {airport.country}
                    </p>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={!canSearch}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-500 px-6 text-sm font-semibold text-slate-900 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            <Search className="size-4" />
            Search
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{helperLabel}</p>
    </form>
  );
}
