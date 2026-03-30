"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  Users,
} from "lucide-react";

import styles from "./flight-search-engine.module.css";
import { AirportInput, type Airport } from "../../../shared/airport-input";
import { TrendingSearches } from "../../../shared/trending-searches";
import type { CabinClass, TripType } from "@/lib/flights/types";

const CABIN_CLASSES = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
] as const;

type FlightSearchEngineProps = {
  variant?: "hero" | "embedded";
  initialValues?: {
    tripType?: TripType;
    directOnly?: boolean;
    adults?: number;
    children?: number;
    infants?: number;
    cabinClass?: CabinClass;
    origin?: string;
    originIata?: string;
    destination?: string;
    destinationIata?: string;
    departureDate?: string;
    returnDate?: string;
  };
};

const trendingSearches = [
  { origin: "Karachi", destination: "Jeddah" },
  { origin: "Lahore", destination: "Madinah" },
  { origin: "Islamabad", destination: "Dubai" },
  { origin: "London", destination: "Istanbul" },
  { origin: "Manchester", destination: "Doha" },
  { origin: "Riyadh", destination: "Istanbul" },
];

export function FlightSearchEngine({
  variant = "hero",
  initialValues,
}: FlightSearchEngineProps) {
  const router = useRouter();

  const [tripType, setTripType] = useState<TripType>(
    initialValues?.tripType ?? "one-way",
  );
  const [directOnly, setDirectOnly] = useState(
    initialValues?.directOnly ?? false,
  );
  const [adults, setAdults] = useState(initialValues?.adults ?? 1);
  const [children, setChildren] = useState(initialValues?.children ?? 0);
  const [infants, setInfants] = useState(initialValues?.infants ?? 0);
  const [cabinClass, setCabinClass] = useState<CabinClass>(
    initialValues?.cabinClass ?? "Economy",
  );
  const [origin, setOrigin] = useState(initialValues?.origin ?? "");
  const [originIata, setOriginIata] = useState(initialValues?.originIata ?? "");
  const [destination, setDestination] = useState(
    initialValues?.destination ?? "",
  );
  const [destinationIata, setDestinationIata] = useState(
    initialValues?.destinationIata ?? "",
  );
  const [departureDate, setDepartureDate] = useState(
    initialValues?.departureDate ?? "",
  );
  const [returnDate, setReturnDate] = useState(initialValues?.returnDate ?? "");
  const [showPax, setShowPax] = useState(false);
  const [showCabin, setShowCabin] = useState(false);

  const paxRef = useRef<HTMLDivElement>(null);
  const cabinRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (paxRef.current && !paxRef.current.contains(e.target as Node))
        setShowPax(false);
      if (cabinRef.current && !cabinRef.current.contains(e.target as Node))
        setShowCabin(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const boundedInfants = Math.min(infants, adults);

  const passengerLabel = `${adults} Adult${adults !== 1 ? "s" : ""}, ${children} Child${children !== 1 ? "ren" : ""}, ${boundedInfants} Infant${boundedInfants !== 1 ? "s" : ""} (on lap)`;

  const handleSwapRoute = () => {
    setOrigin(destination);
    setOriginIata(destinationIata);
    setDestination(origin);
    setDestinationIata(originIata);
  };

  const handleTripTypeChange = (type: TripType) => {
    setTripType(type);
    if (type !== "round-trip") setReturnDate("");
  };

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    // Client-side validation for airport codes
    const originCode = originIata || origin.trim().toUpperCase();
    const destCode = destinationIata || destination.trim().toUpperCase();
    const originMatch = originCode.match(/[A-Z]{3}/);
    const destMatch = destCode.match(/[A-Z]{3}/);

    if (!originMatch || !originMatch[0]) {
      window.alert("Please select a valid origin airport.");
      return;
    }
    if (!destMatch || !destMatch[0]) {
      window.alert("Please select a valid destination airport.");
      return;
    }
    if (!departureDate) {
      window.alert("Please select a departure date.");
      return;
    }

    if (
      tripType === "round-trip" &&
      returnDate &&
      new Date(returnDate) < new Date(departureDate)
    ) {
      window.alert("Return date must be on or after the departure date.");
      return;
    }

    const params = new URLSearchParams({
      tripType,
      origin: originMatch[0],
      destination: destMatch[0],
      departureDate,
      returnDate: tripType === "round-trip" ? returnDate : "",
      adults: String(adults),
      children: String(children),
      infants: String(boundedInfants),
      cabinClass,
      directOnly: String(directOnly),
    });
    router.push(`/flights?${params.toString()}`);
  };

  const isHero = variant === "hero";

  return (
    <section
      className={isHero ? styles.homeHero : styles.embeddedSearch}
      aria-label="Flight search engine"
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
              Built for serious flight search
            </div>
            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Find the best flight in seconds.
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-blue-50/95 sm:text-lg">
              One clean row to search, compare, and book faster.
            </p>
          </div>
        ) : null}

        <form
          className={`${styles.searchCard} mx-auto max-w-6xl`}
          onSubmit={handleSubmit}
        >
          {/* Controls row */}
          <div className={styles.controlsRow}>
            <div className={styles.tripTypeTabs}>
              {(["one-way", "round-trip", "multi-city"] as const).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTripTypeChange(type)}
                    className={`${styles.tripTab} ${tripType === type ? styles.tripTabActive : ""}`}
                  >
                    {type === "one-way"
                      ? "One-way"
                      : type === "round-trip"
                        ? "Round-trip"
                        : "Multi-city"}
                  </button>
                ),
              )}
            </div>

            <div className={styles.rightControls}>
              <label className={styles.directLabel}>
                <input
                  type="checkbox"
                  checked={directOnly}
                  onChange={(e) => setDirectOnly(e.target.checked)}
                />
                Direct Flights only
              </label>

              <div className={styles.dropdownWrapper} ref={paxRef}>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={() => {
                    setShowPax((v) => !v);
                    setShowCabin(false);
                  }}
                  aria-expanded={showPax}
                >
                  <Users className="h-4 w-4" />
                  <span>{passengerLabel}</span>
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
                        max: 9,
                      },
                      {
                        label: "Children",
                        sub: "2-11 years",
                        value: children,
                        set: setChildren,
                        min: 0,
                        max: 9,
                      },
                      {
                        label: "Infants (on lap)",
                        sub: "Under 2 years",
                        value: boundedInfants,
                        set: setInfants,
                        min: 0,
                        max: adults,
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
                            -
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
                  </div>
                )}
              </div>

              <div className={styles.dropdownWrapper} ref={cabinRef}>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={() => {
                    setShowCabin((v) => !v);
                    setShowPax(false);
                  }}
                  aria-expanded={showCabin}
                >
                  <span>{cabinClass}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 ${styles.ctrlBtnIcon}`}
                  />
                </button>
                {showCabin && (
                  <div className={styles.dropdownPanel}>
                    {CABIN_CLASSES.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        className={`${styles.cabinOption} ${cabinClass === cls ? styles.cabinOptionActive : ""}`}
                        onClick={() => {
                          setCabinClass(cls);
                          setShowCabin(false);
                        }}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fields row */}
          <div className={styles.fieldsRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>From</span>
              <div className={styles.fieldBody}>
                <PlaneTakeoff className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <AirportInput
                  value={origin}
                  onChange={(raw) => {
                    setOrigin(raw);
                    setOriginIata("");
                  }}
                  onSelect={(a: Airport) => {
                    setOrigin(`${a.city} (${a.iata})`);
                    setOriginIata(a.iata);
                  }}
                  placeholder="City or airport"
                  required
                  inputClassName={`input input-sm ${styles.daisyInput}`}
                />
              </div>
            </label>

            <button
              type="button"
              onClick={handleSwapRoute}
              className={styles.swapBtn}
              aria-label="Swap origin and destination"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>To</span>
              <div className={styles.fieldBody}>
                <PlaneLanding className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <AirportInput
                  value={destination}
                  onChange={(raw) => {
                    setDestination(raw);
                    setDestinationIata("");
                  }}
                  onSelect={(a: Airport) => {
                    setDestination(`${a.city} (${a.iata})`);
                    setDestinationIata(a.iata);
                  }}
                  placeholder="City or airport"
                  required
                  inputClassName={`input input-sm ${styles.daisyInput}`}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Departure date</span>
              <div className={styles.fieldBody}>
                <CalendarDays className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <input
                  type="date"
                  required
                  min={today}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className={`input input-sm ${styles.daisyInput}`}
                />
              </div>
            </label>

            <label
              className={`${styles.field} ${tripType !== "round-trip" ? styles.fieldDisabled : ""}`}
            >
              <span className={styles.fieldLabel}>Return Date</span>
              <div className={styles.fieldBody}>
                <CalendarDays className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <input
                  type="date"
                  required={tripType === "round-trip"}
                  disabled={tripType !== "round-trip"}
                  min={departureDate || today}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={`input input-sm ${styles.daisyInput}`}
                />
              </div>
            </label>

            <button type="submit" className={styles.searchBtn}>
              <Search className="h-5 w-5" />
              Search Flights
            </button>
          </div>

          {isHero ? (
            <div className={styles.trendingRow}>
              <TrendingSearches
                routes={trendingSearches}
                onSelect={(route) => {
                  setOrigin(route.origin);
                  setOriginIata("");
                  setDestination(route.destination);
                  setDestinationIata("");
                }}
              />
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
