"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Globe2,
  MapPin,
  Search,
  Users,
} from "lucide-react";

import styles from "./package-search.module.css";

export type TourType =
  | "all"
  | "cultural"
  | "adventure"
  | "religious"
  | "family"
  | "luxury";

type PackageSearchEngineProps = {
  variant?: "hero" | "embedded";
  initialValues?: {
    destination?: string;
    duration?: string;
    adults?: number;
    children?: number;
    tourType?: TourType;
  };
  onSearch?: (params: {
    destination: string;
    duration: string;
    adults: number;
    children: number;
    tourType: TourType;
  }) => void;
};

type CitySuggestion = {
  city: string;
  country: string;
  iata: string;
};

const TOUR_TYPE_LABELS: Record<TourType, string> = {
  all: "All Tours",
  cultural: "Cultural",
  adventure: "Adventure",
  religious: "Religious",
  family: "Family",
  luxury: "Luxury",
};

const DURATION_OPTIONS = [
  { value: "3", label: "3 Days" },
  { value: "5", label: "5 Days" },
  { value: "7", label: "1 Week" },
  { value: "10", label: "10 Days" },
  { value: "14", label: "2 Weeks" },
  { value: "21", label: "3 Weeks" },
  { value: "28", label: "4 Weeks" },
];

// Base price per adult per day (used to calculate a live estimate)
const BASE_PRICE_PER_PAX_PER_DAY = 85; // USD

const trendingDestinations = [
  "Dubai",
  "Istanbul",
  "Maldives",
  "Bali",
  "Paris",
  "Tokyo",
  "Cairo",
  "Cappadocia",
];

export function PackageSearchEngine({
  variant = "hero",
  initialValues,
  onSearch,
}: PackageSearchEngineProps) {
  const [tourType, setTourType] = useState<TourType>(
    initialValues?.tourType ?? "all",
  );
  const [destination, setDestination] = useState(
    initialValues?.destination ?? "",
  );
  const [duration, setDuration] = useState(initialValues?.duration ?? "7");
  const [adults, setAdults] = useState(initialValues?.adults ?? 2);
  const [children, setChildren] = useState(initialValues?.children ?? 0);
  const [showPax, setShowPax] = useState(false);
  const [showDuration, setShowDuration] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);

  const paxRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLLabelElement>(null);
  const citySearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPax = adults + children;

  // Live price estimate
  const durationDays = parseInt(duration, 10);
  const estimatedPrice = useMemo(() => {
    const base = durationDays * adults * BASE_PRICE_PER_PAX_PER_DAY;
    const childDiscount =
      children * durationDays * BASE_PRICE_PER_PAX_PER_DAY * 0.5;
    return base + childDiscount;
  }, [durationDays, adults, children]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (paxRef.current && !paxRef.current.contains(e.target as Node)) {
        setShowPax(false);
      }
      if (
        durationRef.current &&
        !durationRef.current.contains(e.target as Node)
      ) {
        setShowDuration(false);
      }
      if (
        destinationRef.current &&
        !destinationRef.current.contains(e.target as Node)
      ) {
        setShowCitySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      if (citySearchTimerRef.current) {
        clearTimeout(citySearchTimerRef.current);
      }
    };
  }, []);

  const paxLabel = `${adults} Adult${adults !== 1 ? "s" : ""}${children > 0 ? `, ${children} Child${children !== 1 ? "ren" : ""}` : ""}`;

  const handleDestinationInput = (value: string) => {
    setDestination(value);

    if (citySearchTimerRef.current) {
      clearTimeout(citySearchTimerRef.current);
    }

    const trimmed = value.trim();

    if (trimmed.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setCityLoading(false);
      return;
    }

    setCityLoading(true);
    setShowCitySuggestions(true);

    citySearchTimerRef.current = setTimeout(() => {
      void fetch(`/api/places/cities?query=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((json: { results?: CitySuggestion[] }) => {
          setCitySuggestions(json.results ?? []);
          setShowCitySuggestions((json.results?.length ?? 0) > 0);
          setCityLoading(false);
        })
        .catch(() => {
          setCitySuggestions([]);
          setShowCitySuggestions(false);
          setCityLoading(false);
        });
    }, 260);
  };

  const selectCity = (item: CitySuggestion) => {
    setDestination(item.city);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setCityLoading(false);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!destination.trim()) {
      window.alert("Please enter a destination.");
      return;
    }
    onSearch?.({ destination, duration, adults, children, tourType });
  };

  const isHero = variant === "hero";

  return (
    <section
      className={isHero ? styles.homeHero : styles.embeddedSearch}
      aria-label="Tour package search engine"
    >
      {isHero ? (
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className={`${styles.heroOrb} ${styles.heroOrbLeft}`} />
          <div className={`${styles.heroOrb} ${styles.heroOrbRight}`} />
        </div>
      ) : null}

      <div
        className={`section-shell relative z-10 ${isHero ? "py-10 md:py-14" : "py-4"}`}
      >
        {isHero ? (
          <div className="mx-auto mb-8 max-w-6xl text-center text-white">
            <div className="mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/95 backdrop-blur-2xl">
              <Globe2 className="h-3.5 w-3.5" />
              Tour Packages Worldwide
            </div>
            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Explore the world your way.
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-orange-50/95 sm:text-lg">
              Discover curated tour packages — handpicked experiences tailored
              to your group and travel style.
            </p>
          </div>
        ) : null}

        <form className={styles.searchCard} onSubmit={handleSubmit}>
          {/* Controls row — tour type tabs + pax trigger */}
          <div className={styles.controlsRow}>
            <div className={styles.tourTypeTabs}>
              {(Object.keys(TOUR_TYPE_LABELS) as TourType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTourType(type)}
                  className={`${styles.tourTab} ${tourType === type ? styles.tourTabActive : ""}`}
                >
                  {TOUR_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            <div className={styles.rightControls}>
              {/* Pax dropdown */}
              <div className={styles.dropdownWrapper} ref={paxRef}>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={() => setShowPax((v) => !v)}
                  aria-expanded={showPax}
                >
                  <Users className="h-4 w-4" />
                  <span>{paxLabel}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 ${styles.ctrlBtnIcon}`}
                  />
                </button>

                {showPax && (
                  <div className={styles.dropdownPanel}>
                    {[
                      {
                        label: "Adults",
                        sub: "12+ years",
                        value: adults,
                        set: setAdults,
                        min: 1,
                        max: 30,
                      },
                      {
                        label: "Children",
                        sub: "Under 12 — 50% off",
                        value: children,
                        set: setChildren,
                        min: 0,
                        max: 20,
                      },
                    ].map(({ label, sub, value, set, min, max }) => (
                      <div key={label} className={styles.paxRow}>
                        <div>
                          <span className={styles.paxLabel}>{label}</span>
                          <span className={styles.paxSub}>{sub}</span>
                        </div>
                        <div className={styles.paxCounter}>
                          <button
                            type="button"
                            className={styles.paxBtn}
                            onClick={() => set(Math.max(min, value - 1))}
                            disabled={value <= min}
                            aria-label={`Decrease ${label}`}
                          >
                            −
                          </button>
                          <span className={styles.paxNum}>{value}</span>
                          <button
                            type="button"
                            className={styles.paxBtn}
                            onClick={() => set(Math.min(max, value + 1))}
                            disabled={value >= max}
                            aria-label={`Increase ${label}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Live price estimate */}
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                        Estimated from
                      </p>
                      <p className="mt-0.5 text-xl font-extrabold text-amber-800">
                        USD {estimatedPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-amber-600">
                        for {totalPax} {totalPax === 1 ? "person" : "people"} ·{" "}
                        {durationDays} days
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fields row */}
          <div className={styles.fieldsRow}>
            {/* Going to */}
            <label className={styles.field} ref={destinationRef}>
              <span className={styles.fieldLabel}>Going to</span>
              <div className={styles.fieldBody}>
                <MapPin className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <input
                  type="text"
                  required
                  value={destination}
                  onFocus={() => {
                    if (citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                  onChange={(e) => handleDestinationInput(e.target.value)}
                  placeholder="City, country or region"
                  className={styles.fieldInput}
                  autoComplete="off"
                />
              </div>
              {showCitySuggestions &&
                (cityLoading || citySuggestions.length > 0) && (
                  <div className="absolute top-full right-0 left-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    {cityLoading ? (
                      <p className="px-2 py-2 text-xs text-slate-500">
                        Searching cities...
                      </p>
                    ) : (
                      citySuggestions.map((cityItem) => (
                        <button
                          key={`${cityItem.city}-${cityItem.country}-${cityItem.iata}`}
                          type="button"
                          onClick={() => selectCity(cityItem)}
                          className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {cityItem.city}
                          </p>
                          <p className="text-xs text-slate-500">
                            {cityItem.country} - {cityItem.iata}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
            </label>

            {/* Duration */}
            <div className={styles.dropdownWrapper} ref={durationRef}>
              <div
                className={styles.field}
                style={{ cursor: "pointer" }}
                onClick={() => setShowDuration((v) => !v)}
              >
                <span className={styles.fieldLabel}>Duration</span>
                <div
                  className={`${styles.fieldBody} ${showDuration ? styles.fieldBodyActive : ""}`}
                >
                  <CalendarDays className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                  <span className={styles.fieldValue}>
                    {DURATION_OPTIONS.find((o) => o.value === duration)
                      ?.label ?? "1 Week"}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 ml-auto transition-transform ${showDuration ? "rotate-180" : ""}`}
                    style={{ color: "#d97706", flexShrink: 0 }}
                  />
                </div>
              </div>

              {showDuration && (
                <div className={styles.durationPanel}>
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.durationOption} ${duration === opt.value ? styles.durationOptionActive : ""}`}
                      onClick={() => {
                        setDuration(opt.value);
                        setShowDuration(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className={styles.searchBtn}>
              <Search className="h-5 w-5" />
              Search Packages
            </button>
          </div>

          {/* Trending destinations */}
          {isHero ? (
            <div className={styles.trendingRow}>
              <span className={styles.trendingLabel}>Trending</span>
              <div className={styles.trendingList}>
                {trendingDestinations.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    className={styles.trendingChip}
                    onClick={() => setDestination(dest)}
                  >
                    <MapPin className="h-3 w-3" />
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
