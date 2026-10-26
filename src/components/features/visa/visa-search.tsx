"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Globe2, Search, Users } from "lucide-react";

import type { VisaType } from "@/lib/admin-settings/visa-settings";
import styles from "./visa-search-engine.module.css";

type SearchVisaType = VisaType | "any";

type VisaSearchEngineProps = {
  variant?: "hero" | "embedded";
  countryOptions?: string[];
  popularCountries?: string[];
  initialValues?: {
    visaType?: SearchVisaType;
    applyingFor?: string;
    adults?: number;
    children?: number;
  };
  onSearch?: (params: {
    visaType: SearchVisaType;
    applyingFor: string;
    adults: number;
    children: number;
  }) => void;
};

const popularDestinations = [
  "Malaysia",
  "UAE",
  "Saudi Arabia",
  "Turkey",
  "United Kingdom",
];

export function VisaSearchEngine({
  variant = "hero",
  countryOptions,
  popularCountries,
  initialValues,
  onSearch,
}: VisaSearchEngineProps) {
  const [visaType, setVisaType] = useState<SearchVisaType>(
    initialValues?.visaType ?? "any",
  );
  const [applyingFor, setApplyingFor] = useState(
    initialValues?.applyingFor ?? "",
  );
  const [adults, setAdults] = useState(initialValues?.adults ?? 1);
  const [children, setChildren] = useState(initialValues?.children ?? 0);
  const [showTravelers, setShowTravelers] = useState(false);

  const travelersRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        travelersRef.current &&
        !travelersRef.current.contains(e.target as Node)
      ) {
        setShowTravelers(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const travelersLabel = useMemo(() => {
    const total = adults + children;
    return `${total} Traveler${total !== 1 ? "s" : ""}`;
  }, [adults, children]);

  const availableCountries =
    countryOptions && countryOptions.length > 0
      ? countryOptions
      : popularDestinations;

  const trendingCountries =
    popularCountries && popularCountries.length > 0
      ? popularCountries
      : availableCountries.slice(0, 6);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!applyingFor.trim()) {
      window.alert("Please enter a destination.");
      return;
    }
    onSearch?.({
      visaType,
      applyingFor,
      adults,
      children,
    });
  };

  const isHero = variant === "hero";

  return (
    <section
      className={isHero ? styles.homeHero : styles.embeddedSearch}
      aria-label="Visa search engine"
    >

      <div
        className={`section-shell relative z-10 ${isHero ? "pb-10 pt-14 md:pb-14 md:pt-20" : "py-4"}`}
      >
        {isHero ? (
          <div className="mx-auto mb-8 max-w-4xl text-center text-white md:mb-10">
            <h1 className="display-font text-balance text-4xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl">
              Apply for your visa in minutes
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)] sm:text-lg">
              Pick a destination, add travellers and we guide you through every step.
            </p>
          </div>
        ) : null}

        <form className={styles.searchCard} onSubmit={handleSubmit}>
          <div className={styles.controlsRow}>
            <div className={styles.stayTypeTabs}>
              {(
                [
                  { value: "any", label: "Any" },
                  { value: "e-visa", label: "e-Visa" },
                  { value: "sticker-visa", label: "Sticker Visa" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisaType(option.value)}
                  className={`${styles.stayTab} ${visaType === option.value ? styles.stayTabActive : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.fieldsRow}>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.fieldLabel}>Applying for</span>
              <div className={styles.fieldBody}>
                <Globe2 className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                <input
                  type="text"
                  required
                  value={applyingFor}
                  onChange={(e) => setApplyingFor(e.target.value)}
                  placeholder="Country or destination"
                  className={styles.fieldInput}
                  list="visa-country-options"
                />
              </div>
            </label>
            <datalist id="visa-country-options">
              {availableCountries.map((country) => (
                <option key={country} value={country} />
              ))}
            </datalist>

            <div className={styles.dropdownWrapper} ref={travelersRef}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Travellers</span>
                <div className={styles.fieldBody}>
                  <Users className={`h-4 w-4 ${styles.fieldBodyIcon}`} />
                  <button
                    type="button"
                    className={styles.fieldButton}
                    onClick={() => setShowTravelers((v) => !v)}
                    aria-expanded={showTravelers}
                  >
                    {travelersLabel}
                  </button>
                  <ChevronDown
                    className={`h-3.5 w-3.5 ${styles.ctrlBtnIcon}`}
                  />
                </div>
              </div>
              {showTravelers ? (
                <div className={styles.dropdownPanel}>
                  {[
                    {
                      label: "Adults",
                      sub: "12+ years",
                      value: adults,
                      set: setAdults,
                      min: 1,
                      max: 20,
                    },
                    {
                      label: "Children",
                      sub: "Under 12 years",
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
                </div>
              ) : null}
            </div>

            <button type="submit" className={styles.searchBtn}>
              <Search className="h-5 w-5" />
              Find Visa
            </button>
          </div>

          {isHero ? (
            <div className={styles.trendingRow}>
              <span className={styles.trendingLabel}>Popular</span>
              <div className={styles.trendingList}>
                {trendingCountries.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    className={styles.trendingChip}
                    onClick={() => setApplyingFor(dest)}
                  >
                    <Globe2 className="h-3 w-3" />
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
