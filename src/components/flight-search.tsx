"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  CalendarDays,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  Users,
} from "lucide-react";

import styles from "./flight-search-engine.module.css";
import { TrendingSearches } from "./trending-searches";

export function FlightSearchEngine() {
  const router = useRouter();
  const trendingSearches = [
    { origin: "Karachi", destination: "Jeddah" },
    { origin: "Lahore", destination: "Madinah" },
    { origin: "Islamabad", destination: "Dubai" },
    { origin: "London", destination: "Istanbul" },
    { origin: "Manchester", destination: "Doha" },
    { origin: "Riyadh", destination: "Istanbul" },
  ];
  const [tripType, setTripType] = useState<"round-trip" | "one-way">(
    "round-trip",
  );
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelers, setTravelers] = useState(1);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleSwapRoute = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      tripType === "round-trip" &&
      new Date(returnDate) < new Date(departureDate)
    ) {
      window.alert("Return date must be the same as or after departure date.");
      return;
    }

    const params = new URLSearchParams({
      tripType,
      origin: origin.trim(),
      destination: destination.trim(),
      departureDate,
      returnDate: tripType === "round-trip" ? returnDate : "",
      adults: String(travelers),
      children: "0",
      infants: "0",
    });

    router.push(`/flights?${params.toString()}`);
  };

  return (
    <section className={styles.homeHero} aria-label="Flight search banner">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className={`${styles.heroOrb} ${styles.heroOrbLeft}`} />
        <div className={`${styles.heroOrb} ${styles.heroOrbRight}`} />
      </div>

      <div className="section-shell py-12 md:py-16 lg:py-20">
        <div className={`${styles.heroIntent} mx-auto max-w-6xl text-white`}>
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/95 backdrop-blur-2xl sm:w-fit">
            Built for serious flight search
          </div>

          <h1 className="mt-6 text-center text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Find the best flight in seconds.
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-7 text-blue-50/95 sm:text-lg">
            One clean row to search, compare, and book faster.
          </p>

          <form
            className={`${styles.searchEngine} mx-auto mt-8 max-w-6xl text-left`}
            onSubmit={handleSubmit}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTripType("round-trip")}
                className={`${styles.modePill} ${tripType === "round-trip" ? styles.modePillActive : ""}`}
              >
                Round trip
              </button>
              <button
                type="button"
                onClick={() => {
                  setTripType("one-way");
                  setReturnDate("");
                }}
                className={`${styles.modePill} ${tripType === "one-way" ? styles.modePillActive : ""}`}
              >
                One way
              </button>
            </div>

            <div className={styles.singleRowForm}>
              <label className={`${styles.searchField} ${styles.fieldOrigin}`}>
                <span
                  className={`${styles.searchLabel} flex items-center gap-1`}
                >
                  <PlaneTakeoff className="h-3.5 w-3.5" /> Origin
                </span>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  placeholder="Karachi"
                  className={styles.searchInput}
                />
              </label>

              <button
                type="button"
                onClick={handleSwapRoute}
                className={styles.routeSwap}
                aria-label="Swap origin and destination"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>

              <label
                className={`${styles.searchField} ${styles.fieldDestination}`}
              >
                <span
                  className={`${styles.searchLabel} flex items-center gap-1`}
                >
                  <PlaneLanding className="h-3.5 w-3.5" /> Destination
                </span>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Jeddah"
                  className={styles.searchInput}
                />
              </label>

              <label className={`${styles.searchField} ${styles.fieldDate}`}>
                <span
                  className={`${styles.searchLabel} flex items-center gap-1`}
                >
                  <CalendarDays className="h-3.5 w-3.5" /> Departure
                </span>
                <input
                  type="date"
                  required
                  min={today}
                  value={departureDate}
                  onChange={(event) => setDepartureDate(event.target.value)}
                  className={styles.searchInput}
                />
              </label>

              <label className={`${styles.searchField} ${styles.fieldDate}`}>
                <span className={styles.searchLabel}>Return</span>
                <input
                  type="date"
                  required={tripType === "round-trip"}
                  disabled={tripType === "one-way"}
                  min={departureDate || today}
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className={`${styles.searchInput} disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
                />
              </label>

              <label
                className={`${styles.searchField} ${styles.fieldTravelers}`}
              >
                <span
                  className={`${styles.searchLabel} flex items-center gap-1`}
                >
                  <Users className="h-3.5 w-3.5" /> Travelers
                </span>
                <select
                  value={travelers}
                  onChange={(event) => setTravelers(Number(event.target.value))}
                  className={styles.searchInput}
                >
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className={styles.searchCta}>
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>

            <p className="mt-4 text-center text-sm font-medium text-slate-600">
              {travelers} traveler{travelers > 1 ? "s" : ""} •{" "}
              {tripType === "round-trip" ? "Round trip" : "One way"}
            </p>
          </form>

          <div className="mx-auto mt-4 max-w-6xl rounded-2xl border border-white/35 bg-white/15 px-4 py-3 backdrop-blur-xl">
            <TrendingSearches
              routes={trendingSearches}
              onSelect={(route) => {
                setOrigin(route.origin);
                setDestination(route.destination);
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
