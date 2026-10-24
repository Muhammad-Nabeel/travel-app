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
import { useCurrencySettings } from "@/lib/hooks/use-currency-settings";
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
    multiCityLegs?: Array<{
      origin: string;
      originIata?: string;
      destination: string;
      destinationIata?: string;
      departureDate: string;
    }>;
  };
};

type MultiCityLegState = {
  origin: string;
  originIata: string;
  destination: string;
  destinationIata: string;
  departureDate: string;
};

type TrendingRoute = {
  origin: string;
  destination: string;
  originIata: string;
  destinationIata: string;
};

type FareCell = {
  date: string;
  amount: number;
  currency: string;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function extractAirportCode(raw: string, explicitIata: string) {
  if (explicitIata) return explicitIata.toUpperCase();
  const upper = raw.toUpperCase();
  const match = upper.match(/[A-Z]{3}/);
  return match ? match[0] : "";
}

function formatDateForInput(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function formatMonthYear(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function formatSelectedDateLabel(value: string) {
  if (!value) return "Select date";
  const date = parseISODate(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFare(amount: number, currency: string) {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  if (currency.toUpperCase() === "PKR") {
    return `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
  }
  return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
}

function getMonthCells(monthStart: Date) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayFirstOffset = (firstDay + 6) % 7;
  const cells: Array<number | null> = [];

  for (let i = 0; i < mondayFirstOffset; i += 1) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(d);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function FlightSearchEngine({
  variant = "hero",
  initialValues,
}: FlightSearchEngineProps) {
  const router = useRouter();
  const { settings: currencySettings, loading: currencyLoading } = useCurrencySettings();

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
  const [showFareCalendar, setShowFareCalendar] = useState(false);
  const [calendarField, setCalendarField] = useState<
    "departure" | "return" | "multi-city"
  >("departure");
  const [calendarLegIndex, setCalendarLegIndex] = useState<number | null>(null);
  const [currency, setCurrency] = useState("PKR");
  const [roundTripRangeStep, setRoundTripRangeStep] = useState<"start" | "end">(
    "start",
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [calendarFares, setCalendarFares] = useState<Record<string, FareCell>>(
    {},
  );
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarSource, setCalendarSource] = useState<"sabre" | "mock" | "">(
    "",
  );
  const [singleMonthCalendar, setSingleMonthCalendar] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlCurrency = new URLSearchParams(window.location.search)
      .get("currency")
      ?.toUpperCase();
    const storedCurrency = window.localStorage
      .getItem("selectedCurrency")
      ?.toUpperCase();

    setCurrency(urlCurrency || storedCurrency || (!currencyLoading ? currencySettings.defaultCurrency : "PKR"));
  }, [currencySettings.defaultCurrency, currencyLoading]);
  const [trendingRoutes, setTrendingRoutes] = useState<TrendingRoute[]>([]);
  const [multiCityLegs, setMultiCityLegs] = useState<MultiCityLegState[]>(
    () => {
      if (
        initialValues?.multiCityLegs &&
        initialValues.multiCityLegs.length >= 2
      ) {
        return initialValues.multiCityLegs.slice(0, 6).map((leg) => ({
          origin: leg.origin,
          originIata: leg.originIata ?? "",
          destination: leg.destination,
          destinationIata: leg.destinationIata ?? "",
          departureDate: leg.departureDate,
        }));
      }

      return [
        {
          origin: initialValues?.origin ?? "",
          originIata: initialValues?.originIata ?? "",
          destination: initialValues?.destination ?? "",
          destinationIata: initialValues?.destinationIata ?? "",
          departureDate: initialValues?.departureDate ?? "",
        },
        {
          origin: initialValues?.destination ?? "",
          originIata: initialValues?.destinationIata ?? "",
          destination: "",
          destinationIata: "",
          departureDate:
            initialValues?.returnDate ?? initialValues?.departureDate ?? "",
        },
      ];
    },
  );

  const paxRef = useRef<HTMLDivElement>(null);
  const cabinRef = useRef<HTMLDivElement>(null);
  const fareCalendarPanelRef = useRef<HTMLDivElement>(null);
  const minSelectableDepartureDate = useMemo(
    () => formatDateForInput(addDays(new Date(), 3)),
    [],
  );

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (paxRef.current && !paxRef.current.contains(e.target as Node))
        setShowPax(false);
      if (cabinRef.current && !cabinRef.current.contains(e.target as Node))
        setShowCabin(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [currencySettings.defaultCurrency, currencyLoading]);

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

    if (type === "multi-city" && multiCityLegs.length < 2) {
      setMultiCityLegs([
        {
          origin,
          originIata,
          destination,
          destinationIata,
          departureDate,
        },
        {
          origin: destination,
          originIata: destinationIata,
          destination: "",
          destinationIata: "",
          departureDate: returnDate || departureDate,
        },
      ]);
    }
  };

  const updateMultiCityLeg = (
    index: number,
    patch: Partial<MultiCityLegState>,
  ) => {
    setMultiCityLegs((previous) => {
      const next = previous.map((leg, i) =>
        i === index ? { ...leg, ...patch } : leg,
      );

      // Keep itinerary chained: destination of current leg becomes origin of next leg.
      if (
        index + 1 < next.length &&
        (Object.prototype.hasOwnProperty.call(patch, "destination") ||
          Object.prototype.hasOwnProperty.call(patch, "destinationIata"))
      ) {
        const destinationValue =
          patch.destination !== undefined
            ? patch.destination
            : next[index].destination;
        const destinationIataValue =
          patch.destinationIata !== undefined
            ? patch.destinationIata
            : next[index].destinationIata;

        next[index + 1] = {
          ...next[index + 1],
          origin: destinationValue,
          originIata: destinationIataValue,
        };
      }

      return next;
    });
  };

  const addMultiCityLeg = () => {
    setMultiCityLegs((previous) => {
      if (previous.length >= 6) return previous;

      const lastLeg = previous[previous.length - 1];
      const previousDate =
        lastLeg?.departureDate || formatDateForInput(addDays(new Date(), 3));

      return [
        ...previous,
        {
          origin: lastLeg?.destination ?? "",
          originIata: lastLeg?.destinationIata ?? "",
          destination: "",
          destinationIata: "",
          departureDate: previousDate,
        },
      ];
    });
  };

  const removeMultiCityLeg = (index: number) => {
    setMultiCityLegs((previous) => {
      if (previous.length <= 2) return previous;
      return previous.filter((_, i) => i !== index);
    });
  };

  const openFareCalendar = (
    field: "departure" | "return" | "multi-city",
    legIndex?: number,
  ) => {
    setCalendarField(field);
    setCalendarLegIndex(field === "multi-city" ? (legIndex ?? 0) : null);
    setRoundTripRangeStep(
      field === "departure" && tripType === "round-trip" ? "start" : "end",
    );
    setShowFareCalendar(true);

    const selectedDate =
      field === "departure"
        ? departureDate || minSelectableDepartureDate
        : field === "return"
          ? returnDate || departureDate || minSelectableDepartureDate
          : multiCityLegs[legIndex ?? 0]?.departureDate ||
            minSelectableDepartureDate;

    setCalendarMonth(startOfMonth(parseISODate(selectedDate)));
  };

  const loadFareCalendar = async (monthStart: Date, signal?: AbortSignal) => {
    const legContext =
      tripType === "multi-city" && calendarField === "multi-city"
        ? multiCityLegs[calendarLegIndex ?? 0]
        : null;

    const originCode = legContext
      ? extractAirportCode(legContext.origin, legContext.originIata)
      : extractAirportCode(origin, originIata);
    const destinationCode = legContext
      ? extractAirportCode(legContext.destination, legContext.destinationIata)
      : extractAirportCode(destination, destinationIata);

    if (!originCode || !destinationCode) {
      setCalendarError(
        legContext
          ? "Select valid origin and destination for this leg first."
          : "Select valid origin and destination airports first.",
      );
      setCalendarFares({});
      setCalendarSource("");
      return;
    }

    setCalendarLoading(true);
    setCalendarError("");

    try {
      const month = formatDateForInput(monthStart);
      const fareCalendarQuery = new URLSearchParams({
        origin: originCode,
        destination: destinationCode,
        month,
        months: "2",
        cabinClass,
      });

      if (tripType === "round-trip" && calendarField !== "multi-city") {
        fareCalendarQuery.set("tripType", tripType);
        if (departureDate)
          fareCalendarQuery.set("departureDate", departureDate);
        if (returnDate) fareCalendarQuery.set("returnDate", returnDate);
      }

      const res = await fetch(
        `/api/search/fare-calendar?${fareCalendarQuery.toString()}`,
        { signal },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        source?: "sabre" | "mock";
        fares?: FareCell[];
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setCalendarError(data.error ?? "Unable to load fare calendar.");
        setCalendarFares({});
        setCalendarSource("");
        return;
      }

      const mapped: Record<string, FareCell> = {};
      for (const item of data.fares ?? []) {
        if (!item?.date || !Number.isFinite(item.amount)) continue;
        mapped[item.date] = item;
      }

      setCalendarFares(mapped);
      setCalendarSource(data.source ?? "");
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setCalendarError("Unable to load fare calendar.");
      setCalendarFares({});
      setCalendarSource("");
    } finally {
      if (!signal?.aborted) {
        setCalendarLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!showFareCalendar) return;
    const controller = new AbortController();
    void loadFareCalendar(calendarMonth, controller.signal);
    return () => controller.abort();
  }, [
    showFareCalendar,
    calendarMonth,
    calendarField,
    calendarLegIndex,
    multiCityLegs,
    origin,
    originIata,
    destination,
    destinationIata,
    cabinClass,
    tripType,
    departureDate,
    returnDate,
    loadFareCalendar,
  ]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch("/api/search/trending", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { ok?: boolean; routes?: TrendingRoute[] }) => {
        if (cancelled) return;
        if (!data?.ok || !Array.isArray(data.routes)) {
          setTrendingRoutes([]);
          return;
        }
        setTrendingRoutes(data.routes);
      })
      .catch(() => {
        if (!cancelled) setTrendingRoutes([]);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currencySettings.defaultCurrency, currencyLoading]);

  useEffect(() => {
    if (!showFareCalendar) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (
        fareCalendarPanelRef.current &&
        target &&
        !fareCalendarPanelRef.current.contains(target)
      ) {
        setShowFareCalendar(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowFareCalendar(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [showFareCalendar]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateCalendarLayout = () => {
      setSingleMonthCalendar(mediaQuery.matches);
    };

    updateCalendarLayout();

    mediaQuery.addEventListener("change", updateCalendarLayout);
    return () => {
      mediaQuery.removeEventListener("change", updateCalendarLayout);
    };
  }, [currencySettings.defaultCurrency, currencyLoading]);

  const renderFareMonth = (monthStart: Date) => {
    const cells = getMonthCells(monthStart);
    const activeLeg =
      tripType === "multi-city" && calendarField === "multi-city"
        ? multiCityLegs[calendarLegIndex ?? 0]
        : null;
    const previousLegDate =
      tripType === "multi-city" && calendarField === "multi-city"
        ? multiCityLegs[(calendarLegIndex ?? 0) - 1]?.departureDate
        : "";
    const minDateIso =
      calendarField === "multi-city"
        ? previousLegDate || minSelectableDepartureDate
        : calendarField === "return" || roundTripRangeStep === "end"
          ? departureDate || minSelectableDepartureDate
          : minSelectableDepartureDate;
    const minDate = parseISODate(minDateIso);
    const rangeStart = departureDate;
    const rangeEnd = returnDate;

    return (
      <div className={styles.fareMonth}>
        <div className={styles.fareMonthTitle}>
          {formatMonthYear(monthStart)}
        </div>
        <div className={styles.fareWeekdays}>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className={styles.fareGrid}>
          {cells.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${monthStart}-${idx}`}
                  className={styles.fareCellEmpty}
                />
              );
            }

            const date = new Date(
              monthStart.getFullYear(),
              monthStart.getMonth(),
              day,
            );
            const iso = formatDateForInput(date);
            const fare = calendarFares[iso];
            const disabled = date < minDate;
            const isRangeStart =
              tripType === "round-trip" &&
              Boolean(departureDate) &&
              iso === departureDate;
            const isRangeEnd =
              tripType === "round-trip" &&
              Boolean(returnDate) &&
              iso === returnDate;
            const selected =
              tripType === "round-trip"
                ? isRangeStart || isRangeEnd
                : calendarField === "multi-city"
                  ? activeLeg?.departureDate === iso
                  : departureDate === iso;
            const inRange =
              Boolean(rangeStart && rangeEnd) &&
              iso > rangeStart &&
              iso < rangeEnd;

            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (calendarField === "multi-city") {
                    if (calendarLegIndex === null) return;
                    updateMultiCityLeg(calendarLegIndex, {
                      departureDate: iso,
                    });
                    setShowFareCalendar(false);
                    return;
                  }

                  if (calendarField === "return") {
                    setReturnDate(iso);
                    setRoundTripRangeStep("end");
                    setShowFareCalendar(false);
                    return;
                  }

                  if (tripType === "round-trip") {
                    if (roundTripRangeStep === "start") {
                      setDepartureDate(iso);
                      setReturnDate("");
                      setRoundTripRangeStep("end");
                      setCalendarField("return");
                    } else {
                      if (iso < departureDate) {
                        setDepartureDate(iso);
                        setReturnDate("");
                        setRoundTripRangeStep("end");
                        setCalendarField("return");
                        return;
                      }
                      setReturnDate(iso);
                      setRoundTripRangeStep("start");
                      setShowFareCalendar(false);
                    }
                  } else {
                    setDepartureDate(iso);
                    if (returnDate && returnDate < iso) {
                      setReturnDate("");
                    }
                    setRoundTripRangeStep("start");
                    setShowFareCalendar(false);
                  }
                }}
                className={`${styles.fareCell} ${selected ? styles.fareCellSelected : ""} ${inRange ? styles.fareCellInRange : ""} ${isRangeStart ? styles.fareCellRangeStart : ""} ${isRangeEnd ? styles.fareCellRangeEnd : ""}`}
              >
                <span className={styles.fareDayNumber}>{day}</span>
                <span className={styles.fareAmount}>
                  {fare ? formatFare(fare.amount, fare.currency) : "-"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const resolvedLegs =
      tripType === "multi-city"
        ? multiCityLegs.map((leg) => ({
            origin: leg.originIata || leg.origin,
            destination: leg.destinationIata || leg.destination,
            departureDate: leg.departureDate,
          }))
        : undefined;

    const primaryOrigin =
      tripType === "multi-city"
        ? (resolvedLegs?.[0]?.origin ?? "")
        : originIata || origin;
    const primaryDestination =
      tripType === "multi-city"
        ? (resolvedLegs?.[resolvedLegs.length - 1]?.destination ?? "")
        : destinationIata || destination;
    const primaryDepartureDate =
      tripType === "multi-city"
        ? (resolvedLegs?.[0]?.departureDate ?? "")
        : departureDate;

    const validation = flightSearchSchema.safeParse({
      tripType,
      origin: primaryOrigin,
      destination: primaryDestination,
      departureDate: primaryDepartureDate,
      returnDate: tripType === "round-trip" ? returnDate : "",
      legs: resolvedLegs,
      adults,
      children,
      infants: boundedInfants,
      cabinClass,
      currency,
      directOnly,
    });

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      window.alert(firstIssue?.message ?? "Please review your search details.");
      return;
    }

    const parsed = validation.data;

    if (parsed.departureDate < minSelectableDepartureDate) {
      window.alert(
        `Departure date must be at least 3 days from today (${minSelectableDepartureDate}).`,
      );
      return;
    }

    if (parsed.tripType === "multi-city") {
      const invalidLeg = (parsed.legs ?? []).find(
        (leg) => leg.departureDate < minSelectableDepartureDate,
      );
      if (invalidLeg) {
        window.alert(
          `All multi-city dates must be at least 3 days from today (${minSelectableDepartureDate}).`,
        );
        return;
      }
    }

    const params = new URLSearchParams({
      tripType: parsed.tripType,
      origin: parsed.origin,
      destination: parsed.destination,
      departureDate: parsed.departureDate,
      returnDate:
        parsed.tripType === "round-trip" ? (parsed.returnDate ?? "") : "",
      adults: String(parsed.adults),
      children: String(parsed.children),
      infants: String(parsed.infants),
      cabinClass: parsed.cabinClass,
      currency: parsed.currency,
      directOnly: String(parsed.directOnly),
    });
    if (parsed.tripType === "multi-city" && (parsed.legs?.length ?? 0) > 0) {
      params.set("legs", JSON.stringify(parsed.legs));
    }

    trackGa4Event("flight_search_submitted", {
      trip_type: parsed.tripType,
      origin: parsed.origin,
      destination: parsed.destination,
      departure_date: parsed.departureDate,
      return_date: parsed.returnDate ?? "",
      cabin_class: parsed.cabinClass,
      adults: parsed.adults,
      children: parsed.children,
      infants: parsed.infants,
      direct_only: parsed.directOnly,
      search_surface: variant,
      leg_count: parsed.legs?.length ?? 0,
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
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-80">
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

        <form className={styles.searchCard} onSubmit={handleSubmit}>
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
            {tripType === "multi-city" ? (
              <div className={styles.multiCityPanel}>
                {multiCityLegs.map((leg, index) => {
                  return (
                    <div
                      key={`multi-leg-${index}`}
                      className={styles.multiCityRow}
                    >
                      <div className={styles.multiCityIndex}>
                        Leg {index + 1}
                      </div>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>From</span>
                        <div className={styles.fieldBody}>
                          <PlaneTakeoff
                            className={`h-4 w-4 ${styles.fieldBodyIcon}`}
                          />
                          <AirportInput
                            value={leg.origin}
                            onChange={(raw) =>
                              updateMultiCityLeg(index, {
                                origin: raw,
                                originIata: "",
                              })
                            }
                            onSelect={(a: Airport) =>
                              updateMultiCityLeg(index, {
                                origin: `${a.city} (${a.iata})`,
                                originIata: a.iata,
                              })
                            }
                            placeholder="City or airport"
                            required
                            inputClassName={`input input-sm ${styles.daisyInput}`}
                          />
                        </div>
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>To</span>
                        <div className={styles.fieldBody}>
                          <PlaneLanding
                            className={`h-4 w-4 ${styles.fieldBodyIcon}`}
                          />
                          <AirportInput
                            value={leg.destination}
                            onChange={(raw) =>
                              updateMultiCityLeg(index, {
                                destination: raw,
                                destinationIata: "",
                              })
                            }
                            onSelect={(a: Airport) =>
                              updateMultiCityLeg(index, {
                                destination: `${a.city} (${a.iata})`,
                                destinationIata: a.iata,
                              })
                            }
                            placeholder="City or airport"
                            required
                            inputClassName={`input input-sm ${styles.daisyInput}`}
                          />
                        </div>
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>
                          Departure date
                        </span>
                        <div className={styles.fieldBody}>
                          <CalendarDays
                            className={`h-4 w-4 ${styles.fieldBodyIcon}`}
                          />
                          <button
                            type="button"
                            className={styles.fareCalendarTrigger}
                            onClick={() =>
                              openFareCalendar("multi-city", index)
                            }
                          >
                            {leg.departureDate
                              ? formatSelectedDateLabel(leg.departureDate)
                              : "Select date"}
                          </button>
                        </div>
                      </label>

                      <div className={styles.multiCityActions}>
                        {index >= 2 ? (
                          <button
                            type="button"
                            className={styles.multiCityRemoveBtn}
                            onClick={() => removeMultiCityLeg(index)}
                          >
                            Remove
                          </button>
                        ) : (
                          <span className={styles.multiCityHint}>Required</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className={styles.multiCityFooter}>
                  <button
                    type="button"
                    className={styles.multiCityAddBtn}
                    disabled={multiCityLegs.length >= 6}
                    onClick={addMultiCityLeg}
                  >
                    + Add City
                  </button>
                  <p className={styles.multiCityHint}>
                    Up to 6 legs. Each next leg date can be same day or later.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Origin + Swap + Destination — grouped for mobile swap-button layout */}
                <div className={styles.originDestGroup}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>From</span>
                    <div className={styles.fieldBody}>
                      <PlaneTakeoff
                        className={`h-4 w-4 ${styles.fieldBodyIcon}`}
                      />
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
                        placeholder="Leaving From"
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
                      <PlaneLanding
                        className={`h-4 w-4 ${styles.fieldBodyIcon}`}
                      />
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
                        placeholder="Going To"
                        required
                        inputClassName={`input input-sm ${styles.daisyInput}`}
                      />
                    </div>
                  </label>
                </div>

                {/* Departure + Return dates — grouped for mobile side-by-side layout */}
                <div className={styles.dateGroup}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Departure date</span>
                    <div className={styles.fieldBody}>
                      <CalendarDays
                        className={`h-4 w-4 ${styles.fieldBodyIcon}`}
                      />
                      <div className={styles.fareCalendarWrapper}>
                        <button
                          type="button"
                          className={styles.fareCalendarTrigger}
                          onClick={() => openFareCalendar("departure")}
                        >
                          {departureDate
                            ? formatSelectedDateLabel(departureDate)
                            : "Departure Date"}
                        </button>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`${styles.field} ${tripType !== "round-trip" ? styles.fieldDisabled : ""}`}
                  >
                    <span className={styles.fieldLabel}>Return Date</span>
                    <div className={styles.fieldBody}>
                      <CalendarDays
                        className={`h-4 w-4 ${styles.fieldBodyIcon}`}
                      />
                      <button
                        type="button"
                        disabled={tripType !== "round-trip"}
                        onClick={() => openFareCalendar("return")}
                        className={`${styles.fareCalendarTrigger} ${tripType !== "round-trip" ? styles.fareCalendarTriggerDisabled : ""}`}
                      >
                        {returnDate
                          ? formatSelectedDateLabel(returnDate)
                          : "Return Date"}
                      </button>
                    </div>
                  </label>
                </div>
              </>
            )}

            <button type="submit" className={styles.searchBtn}>
              <Search className="h-5 w-5" />
              Search Flights
            </button>
          </div>

          {showFareCalendar && (
            <div
              className={styles.fareCalendarOverlay}
              onClick={() => setShowFareCalendar(false)}
            >
              <div
                className={styles.fareCalendarPanel}
                ref={fareCalendarPanelRef}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.fareCalendarTopBar}>
                  <button
                    type="button"
                    className={styles.fareNavBtn}
                    onClick={() =>
                      setCalendarMonth((prev) => addMonths(prev, -1))
                    }
                    aria-label="Previous months"
                  >
                    &lt;
                  </button>

                  <button
                    type="button"
                    className={styles.fareNavBtn}
                    onClick={() =>
                      setCalendarMonth((prev) => addMonths(prev, 1))
                    }
                    aria-label="Next months"
                  >
                    &gt;
                  </button>
                </div>

                <div className={styles.fareMonthsRow}>
                  {renderFareMonth(calendarMonth)}
                  {!singleMonthCalendar
                    ? renderFareMonth(addMonths(calendarMonth, 1))
                    : null}
                </div>

                <div className={styles.fareCalendarFooter}>
                  {tripType === "round-trip" &&
                  calendarField === "departure" ? (
                    <p>
                      {roundTripRangeStep === "start"
                        ? "Select departure date"
                        : "Now select return date"}
                    </p>
                  ) : null}
                  {tripType === "multi-city" &&
                  calendarField === "multi-city" ? (
                    <p>Select date for leg {(calendarLegIndex ?? 0) + 1}.</p>
                  ) : null}
                  {calendarLoading ? (
                    <p>Loading fares...</p>
                  ) : calendarError ? (
                    <p className={styles.fareCalendarError}>{calendarError}</p>
                  ) : calendarSource ? (
                    <p>
                      Fare source:{" "}
                      {calendarSource === "sabre"
                        ? "Sabre API"
                        : "Estimated fallback"}
                    </p>
                  ) : (
                    <p>Select a date to continue.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isHero ? (
            <div className={styles.trendingRow}>
              <TrendingSearches
                routes={trendingRoutes}
                onSelect={(route) => {
                  setOrigin(`${route.origin} (${route.originIata})`);
                  setOriginIata(route.originIata);
                  setDestination(
                    `${route.destination} (${route.destinationIata})`,
                  );
                  setDestinationIata(route.destinationIata);
                }}
              />
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
