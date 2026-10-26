"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  Users,
} from "lucide-react";

import styles from "./hotel-search-engine.module.css";

type StayType = "hotel-only" | "hotel+flight";

type HotelSearchEngineProps = {
  variant?: "hero" | "embedded";
  initialValues?: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    rooms?: number;
    stayType?: StayType;
  };
  onSearch?: (params: {
    destination: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    rooms: number;
    stayType: StayType;
  }) => void;
};

const trendingDestinations = [
  "Makkah",
  "Madinah",
  "Dubai",
  "Istanbul",
  "London",
  "Karachi",
  "Lahore",
];

export function HotelSearchEngine({
  variant = "hero",
  initialValues,
  onSearch,
}: HotelSearchEngineProps) {
  const [stayType, setStayType] = useState<StayType>(
    initialValues?.stayType ?? "hotel-only",
  );
  const [destination, setDestination] = useState(
    initialValues?.destination ?? "",
  );
  const [checkIn, setCheckIn] = useState(initialValues?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initialValues?.checkOut ?? "");
  const [adults, setAdults] = useState(initialValues?.adults ?? 2);
  const [children, setChildren] = useState(initialValues?.children ?? 0);
  const [rooms, setRooms] = useState(initialValues?.rooms ?? 1);
  const [showGuests, setShowGuests] = useState(false);

  const guestsRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (guestsRef.current && !guestsRef.current.contains(e.target as Node)) {
        setShowGuests(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const guestLabel = `${adults} Adult${adults !== 1 ? "s" : ""}${children > 0 ? `, ${children} Child${children !== 1 ? "ren" : ""}` : ""} · ${rooms} Room${rooms !== 1 ? "s" : ""}`;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!destination.trim()) {
      window.alert("Please enter a destination.");
      return;
    }
    if (!checkIn) {
      window.alert("Please select a check-in date.");
      return;
    }
    if (!checkOut) {
      window.alert("Please select a check-out date.");
      return;
    }
    if (checkOut <= checkIn) {
      window.alert("Check-out date must be after check-in date.");
      return;
    }
    onSearch?.({
      destination,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      stayType,
    });
  };

  const isHero = variant === "hero";

  return (
    <section
      className={isHero ? styles.homeHero : styles.embeddedSearch}
      aria-label="Hotel search engine"
    >

      <div
        className={`section-shell relative z-10 ${isHero ? "pb-10 pt-14 md:pb-14 md:pt-20" : "py-4"}`}
      >
        {isHero ? (
          <div className="mx-auto mb-8 max-w-4xl text-center text-white md:mb-10">
            <h1 className="display-font text-balance text-4xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl">
              Find your perfect stay
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)] sm:text-lg">
              Hotels in Makkah, Madinah and beyond — compare and book with ease.
            </p>
          </div>
        ) : null}

        <form className={styles.searchCard} onSubmit={handleSubmit}>
          {/* Controls row */}
          <div className={styles.controlsRow}>
            <div className={styles.stayTypeTabs}>
              {(["hotel-only", "hotel+flight"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setStayType(type)}
                  className={`${styles.stayTab} ${stayType === type ? styles.stayTabActive : ""}`}
                >
                  {type === "hotel-only" ? "Hotel Only" : "Hotel + Flight"}
                </button>
              ))}
            </div>

            <div className={styles.rightControls}>
              {/* Guests + Rooms dropdown */}
              <div className={styles.dropdownWrapper} ref={guestsRef}>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={() => setShowGuests((v) => !v)}
                  aria-expanded={showGuests}
                >
                  <Users className="h-4 w-4" />
                  <span>{guestLabel}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 ${styles.ctrlBtnIcon}`}
                  />
                </button>
                {showGuests && (
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
                        sub: "Under 12 years",
                        value: children,
                        set: setChildren,
                        min: 0,
                        max: 20,
                      },
                      {
                        label: "Rooms",
                        sub: "Rooms needed",
                        value: rooms,
                        set: setRooms,
                        min: 1,
                        max: 30,
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fields row */}
          <div className={styles.fieldsRow}>
            {/* Destination */}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Destination</span>
              <div className={styles.fieldBody}>
                <MapPin className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="City or hotel name"
                  className={styles.fieldInput}
                />
              </div>
            </label>

            {/* Check-in */}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Check-in</span>
              <div className={styles.fieldBody}>
                <CalendarDays className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <input
                  type="date"
                  required
                  min={today}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut && e.target.value >= checkOut) setCheckOut("");
                  }}
                  className={styles.fieldInput}
                />
              </div>
            </label>

            {/* Check-out */}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Check-out</span>
              <div className={styles.fieldBody}>
                <CalendarDays className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <input
                  type="date"
                  required
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={styles.fieldInput}
                />
              </div>
            </label>

            {/* Rooms (visible display) */}
            <label className={styles.field} style={{ cursor: "default" }}>
              <span className={styles.fieldLabel}>Rooms</span>
              <div className={styles.fieldBody}>
                <Building2 className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <span
                  style={{
                    fontSize: "0.97rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {rooms} Room{rooms !== 1 ? "s" : ""}
                </span>
              </div>
            </label>

            <button type="submit" className={styles.searchBtn}>
              <Search className="h-5 w-5" />
              Search Hotels
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
