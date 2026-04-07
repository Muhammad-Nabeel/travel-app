"use client";

import { useEffect, useRef, useState } from "react";

const AIRPORT_QUERY_CACHE_LIMIT = 120;
const airportQueryCache = new Map<string, Airport[]>();
const MAX_AIRPORT_RESULTS = 8;

function getCachedAirportResults(query: string) {
  return airportQueryCache.get(query.toLowerCase()) ?? null;
}

function setCachedAirportResults(query: string, results: Airport[]) {
  if (airportQueryCache.size >= AIRPORT_QUERY_CACHE_LIMIT) {
    const oldestKey = airportQueryCache.keys().next().value;
    if (oldestKey) {
      airportQueryCache.delete(oldestKey);
    }
  }

  airportQueryCache.set(query.toLowerCase(), results);
}

function airportMatchesQuery(airport: Airport, normalizedUpperQuery: string) {
  return (
    airport.iata.toUpperCase().includes(normalizedUpperQuery) ||
    airport.city.toUpperCase().includes(normalizedUpperQuery) ||
    airport.name.toUpperCase().includes(normalizedUpperQuery) ||
    airport.country.toUpperCase().includes(normalizedUpperQuery)
  );
}

function getPrefixDerivedAirportResults(query: string) {
  let bestPrefix = "";
  let bestResults: Airport[] | null = null;

  for (const [cachedQuery, cachedResults] of airportQueryCache) {
    if (
      cachedQuery.length < 2 ||
      cachedQuery.length >= query.length ||
      cachedResults.length === 0
    ) {
      continue;
    }

    if (
      query.startsWith(cachedQuery) &&
      cachedQuery.length > bestPrefix.length
    ) {
      bestPrefix = cachedQuery;
      bestResults = cachedResults;
    }
  }

  if (!bestResults) {
    return null;
  }

  const normalizedUpperQuery = query.toUpperCase();
  const filtered = bestResults
    .filter((airport) => airportMatchesQuery(airport, normalizedUpperQuery))
    .slice(0, MAX_AIRPORT_RESULTS);

  if (filtered.length === 0) {
    return null;
  }

  setCachedAirportResults(query, filtered);
  return filtered;
}

export type Airport = {
  iata: string;
  city: string;
  name: string;
  country: string;
};

interface AirportInputProps {
  value: string;
  onSelect: (airport: Airport) => void;
  onChange: (raw: string) => void;
  placeholder?: string;
  required?: boolean;
  inputClassName?: string;
}

export function AirportInput({
  value,
  onSelect,
  onChange,
  placeholder,
  required,
  inputClassName,
}: AirportInputProps) {
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function handleChange(raw: string) {
    onChange(raw);
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    const query = raw.trim().toLowerCase();

    if (query.length < 2) {
      requestIdRef.current += 1;
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const cached = getCachedAirportResults(query);
    if (cached) {
      requestIdRef.current += 1;
      setSuggestions(cached);
      setLoading(false);
      setOpen(true);
      return;
    }

    const prefixDerived = getPrefixDerivedAirportResults(query);
    if (prefixDerived) {
      requestIdRef.current += 1;
      setSuggestions(prefixDerived);
      setLoading(false);
      setOpen(true);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setOpen(true);
    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      void fetch(`/api/places/airports?query=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((json: { results?: Airport[] }) => {
          if (requestIdRef.current !== requestId) {
            return;
          }
          const results = json.results ?? [];
          setCachedAirportResults(query, results);
          setSuggestions(results);
          setLoading(false);
        })
        .catch((error: { name?: string }) => {
          if (
            error?.name === "AbortError" ||
            requestIdRef.current !== requestId
          ) {
            return;
          }

          setSuggestions([]);
          setLoading(false);
        });
    }, 280);
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", flex: 1, minWidth: 0 }}
    >
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        spellCheck={false}
      />

      {open && (loading || suggestions.length > 0) && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
            zIndex: 400,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "12px 16px",
                fontSize: "0.875rem",
                color: "#9ca3af",
              }}
            >
              Searching airports...
            </div>
          ) : (
            suggestions.map((airport, idx) => (
              <button
                key={airport.iata}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(airport);
                  setOpen(false);
                  setSuggestions([]);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 14px",
                  border: "none",
                  borderBottom:
                    idx < suggestions.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "#111827",
                  }}
                >
                  {airport.city}{" "}
                  <span style={{ color: "#2563eb" }}>({airport.iata})</span>
                </div>
                <div
                  style={{
                    fontSize: "0.73rem",
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {airport.name} · {airport.country}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
