"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Minus,
  Moon,
  Plus,
  Search,
  Star,
  Users,
} from "lucide-react";

import type { PackageRow } from "@/app/api/packages/route";

// ─── Types ──────────────────────────────────────────────────────────────────

const DURATIONS = [7, 14, 21, 28] as const;
type Duration = (typeof DURATIONS)[number];

// 0 = Any (no preference). Multipliers are relative to a 4★ base.
const STAR_OPTIONS = [3, 4, 5] as const;
type StarRating = 0 | 3 | 4 | 5;

const STAR_MULTIPLIER: Record<StarRating, number> = {
  0: 1.0, // Any — use base price
  3: 0.78, // Economy
  4: 1.0, // Standard (base)
  5: 1.52, // Luxury
};

const STAR_LABEL: Record<StarRating, string> = {
  0: "Any",
  3: "Economy",
  4: "Standard",
  5: "Luxury",
};

type Props = {
  packages: PackageRow[];
  isDummy: boolean;
};

// ─── Pricing helpers ────────────────────────────────────────────────────────

function priceForConfig(
  pkg: PackageRow,
  nights: number,
  adults: number,
  childCount: number,
  makkahStars: StarRating = 0,
  madinahStars: StarRating = 0,
) {
  const baseNights = pkg.makkahNights + pkg.madinahNights;
  if (baseNights === 0) return null;

  const split = nightSplit(pkg, nights);
  const baseRatePerNight = pkg.basePrice / baseNights;
  const makkahMult = STAR_MULTIPLIER[makkahStars];
  const madinahMult = STAR_MULTIPLIER[madinahStars];

  const perPersonTotal = Math.round(
    baseRatePerNight * makkahMult * split.makkah +
      baseRatePerNight * madinahMult * split.madinah,
  );
  const totalPax = adults + childCount;
  const allPaxTotal = perPersonTotal * totalPax;
  const perNightPerPerson = Math.round(
    (baseRatePerNight * makkahMult * split.makkah +
      baseRatePerNight * madinahMult * split.madinah) /
      nights,
  );
  return {
    perNightPerPerson,
    perPersonTotal,
    allPaxTotal,
    totalPax,
    makkahMult,
    madinahMult,
  };
}

function nightSplit(pkg: PackageRow, nights: number) {
  const total = pkg.makkahNights + pkg.madinahNights;
  if (total === 0) return { makkah: nights, madinah: 0 };
  const makkah = Math.round((pkg.makkahNights / total) * nights);
  return { makkah, madinah: nights - makkah };
}

// ─── Star picker ────────────────────────────────────────────────────────────

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StarRating;
  onChange: (v: StarRating) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            value === 0
              ? "border-slate-400 bg-slate-100 text-slate-700"
              : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
          }`}
        >
          Any
        </button>
        {STAR_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              value === n
                ? "border-amber-400 bg-amber-400 text-white shadow-sm"
                : "border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-500"
            }`}
          >
            {Array.from({ length: n }).map((_, i) => (
              <Star
                key={i}
                className={`h-2.5 w-2.5 ${
                  value === n
                    ? "fill-white text-white"
                    : "fill-current text-amber-400"
                }`}
              />
            ))}
            <span className="ml-0.5">{n}★</span>
          </button>
        ))}
        {value !== 0 && (
          <span className="ml-1 text-xs text-slate-400">
            · {STAR_LABEL[value]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Pax dropdown ───────────────────────────────────────────────────────────

function PaxDropdown({
  adults,
  childCount,
  onAdults,
  onChildren,
}: {
  adults: number;
  childCount: number;
  onAdults: (n: number) => void;
  onChildren: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const label =
    `${adults} Adult${adults !== 1 ? "s" : ""}` +
    (childCount > 0
      ? `, ${childCount} Child${childCount !== 1 ? "ren" : ""}`
      : "");

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 6,
        left: r.left + window.scrollX,
        width: Math.max(r.width, 256),
      });
    }
  }, [open]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const panel = open
    ? createPortal(
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
          }}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
        >
          {/* portal panel — rendered at document body, unaffected by parent stacking contexts */}
          {/* Adults */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Adults</p>
              <p className="text-xs text-slate-400">Age 12+</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAdults(Math.max(1, adults - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand hover:text-brand"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-5 text-center text-sm font-semibold tabular-nums">
                {adults}
              </span>
              <button
                type="button"
                onClick={() => onAdults(Math.min(20, adults + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand hover:text-brand"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="border-t border-slate-50" />
          {/* Children */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Children</p>
              <p className="text-xs text-slate-400">Under 12</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChildren(Math.max(0, childCount - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand hover:text-brand"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-5 text-center text-sm font-semibold tabular-nums">
                {childCount}
              </span>
              <button
                type="button"
                onClick={() => onChildren(Math.min(12, childCount + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand hover:text-brand"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-xl bg-brand py-2 text-sm font-medium text-white transition hover:bg-brand-strong"
          >
            Done
          </button>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 min-w-45 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:border-brand/40 hover:shadow-sm"
      >
        <Users className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {panel}
    </>
  );
}

// ─── Package result card ────────────────────────────────────────────────────

function PackageCard({
  pkg,
  nights,
  adults,
  childCount,
  makkahStars,
  madinahStars,
}: {
  pkg: PackageRow;
  nights: Duration;
  adults: number;
  childCount: number;
  makkahStars: StarRating;
  madinahStars: StarRating;
}) {
  const pricing = priceForConfig(
    pkg,
    nights,
    adults,
    childCount,
    makkahStars,
    madinahStars,
  );
  const split = nightSplit(pkg, nights);

  if (!pricing) return null;

  const totalPax = adults + childCount;
  const hasMult = makkahStars !== 0 || madinahStars !== 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md sm:flex-row">
      {/* Accent band */}
      <div className="h-1.5 w-full bg-linear-to-r from-amber-400 via-yellow-300 to-emerald-400 sm:h-auto sm:w-1.5" />

      <div className="flex flex-1 flex-col gap-0 p-5 sm:flex-row sm:gap-6">
        {/* Left: Info */}
        <div className="flex flex-1 flex-col gap-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                {pkg.departureCity}
              </p>
              <h3 className="mt-1 text-lg font-bold leading-snug text-slate-900">
                {pkg.title}
              </h3>
              {pkg.subtitle && (
                <p className="mt-0.5 text-sm text-slate-500">{pkg.subtitle}</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                pkg.status === "PUBLISHED"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {pkg.status.toLowerCase()}
            </span>
          </div>

          {/* Night + hotel rating chips */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-brand/8 px-3 py-1">
              <Moon className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold text-brand">
                {split.makkah}N Makkah
              </span>
              {makkahStars !== 0 && (
                <span className="ml-0.5 flex items-center gap-0.5 text-xs font-medium text-amber-600">
                  {Array.from({ length: makkahStars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </span>
              )}
            </div>
            {split.madinah > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1">
                <Moon className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">
                  {split.madinah}N Madinah
                </span>
                {madinahStars !== 0 && (
                  <span className="ml-0.5 flex items-center gap-0.5 text-xs font-medium text-amber-600">
                    {Array.from({ length: madinahStars }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Hotel note */}
          {pkg.hotelSummary && (
            <p className="text-xs text-slate-500">🏨 {pkg.hotelSummary}</p>
          )}

          {/* Inclusions */}
          {pkg.inclusions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pkg.inclusions.slice(0, 4).map((inc) => (
                <span
                  key={inc}
                  className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500"
                >
                  ✓ {inc}
                </span>
              ))}
              {pkg.inclusions.length > 4 && (
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-400">
                  +{pkg.inclusions.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Seats */}
          {pkg.seatsAvailable > 0 && (
            <p className="text-xs font-medium text-amber-600">
              ⚡ {pkg.seatsAvailable} seats remaining
            </p>
          )}
        </div>

        {/* Right: Pricing panel */}
        <div className="flex flex-col items-end justify-between gap-4 border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              {nights} nights · {totalPax} pax
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-brand-strong">
              {pkg.currency} {pricing.allPaxTotal.toLocaleString()}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-600">
              {pkg.currency} {pricing.perPersonTotal.toLocaleString()}
              <span className="ml-1 text-xs font-normal text-slate-400">
                / person
              </span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              ≈ {pkg.currency} {pricing.perNightPerPerson.toLocaleString()}
              <span className="ml-0.5">/ night per person</span>
            </p>
            {hasMult && (
              <p className="mt-1.5 flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {makkahStars !== 0 ? `${makkahStars}★ Makkah` : "Any Makkah"}
                {" · "}
                {madinahStars !== 0
                  ? `${madinahStars}★ Madinah`
                  : "Any Madinah"}
              </p>
            )}
          </div>

          <button className="whitespace-nowrap rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong active:scale-95">
            Enquire now
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Main configurator ──────────────────────────────────────────────────────

export function UmrahConfigurator({ packages, isDummy }: Props) {
  const [selectedDuration, setSelectedDuration] = useState<Duration>(14);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [departureCity, setDepartureCity] = useState("All");
  const [makkahStars, setMakkahStars] = useState<StarRating>(0);
  const [madinahStars, setMadinahStars] = useState<StarRating>(0);
  const [applied, setApplied] = useState<{
    duration: Duration;
    adults: number;
    children: number;
    city: string;
    makkahStars: StarRating;
    madinahStars: StarRating;
  }>({
    duration: 14,
    adults: 2,
    children: 0,
    city: "All",
    makkahStars: 0,
    madinahStars: 0,
  });

  const departureCities = useMemo(() => {
    const cities = Array.from(
      new Set(packages.map((p) => p.departureCity)),
    ).sort();
    return ["All", ...cities];
  }, [packages]);

  function handleSearch() {
    setApplied({
      duration: selectedDuration,
      adults,
      children,
      city: departureCity,
      makkahStars,
      madinahStars,
    });
  }

  const filtered = useMemo(
    () =>
      packages.filter(
        (p) =>
          p.status === "PUBLISHED" &&
          (applied.city === "All" || p.departureCity === applied.city),
      ),
    [packages, applied.city],
  );

  const totalPax = applied.adults + applied.children;

  return (
    <div className="flex-1">
      {/* ── Hero configurator ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          background: `
            linear-gradient(180deg,
              rgba(120,53,15,0.92) 0%,
              rgba(217,119,6,0.72) 30%,
              rgba(5,150,105,0.65) 65%,
              rgba(226,232,240,0.7) 100%
            ),
            radial-gradient(circle at top left, rgba(245,158,11,0.4), transparent 30%),
            radial-gradient(circle at right 15%, rgba(16,185,129,0.3), transparent 35%)
          `,
        }}
        aria-label="Umrah package configurator"
      >
        {/* Orb decorations */}
        <div
          className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.55), transparent 65%)",
            filter: "blur(48px)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-20 -top-12 h-64 w-64 rounded-full opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(52,211,153,0.5), transparent 62%)",
            filter: "blur(44px)",
          }}
        />

        <div className="section-shell relative z-10 py-14 pb-10">
          {isDummy && (
            <p className="mb-4 inline-block rounded-full border border-amber-200/60 bg-amber-50/20 px-4 py-1 text-xs text-amber-100 backdrop-blur-sm">
              Demo mode — database not connected
            </p>
          )}

          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            Plan your Umrah
          </p>
          <h1 className="display-font mt-2 text-5xl font-bold text-white sm:text-6xl">
            Build your package
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-white/70">
            Choose your duration and group size — see the exact cost per person
            instantly.
          </p>

          {/* ── Search card ── */}
          <div className="mt-8 w-full rounded-2xl bg-white shadow-2xl shadow-black/20">
            {/* Duration tabs */}
            <div className="border-b border-slate-100 px-5 pt-4 pb-3">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Duration
              </p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDuration(d)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      selectedDuration === d
                        ? "bg-brand text-white shadow-sm shadow-brand/30"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand"
                    }`}
                  >
                    {d} nights
                  </button>
                ))}
              </div>
            </div>

            {/* Hotel ratings */}
            <div className="border-b border-slate-100 px-5 pt-4 pb-4 flex flex-col gap-4 sm:flex-row sm:gap-8">
              <StarPicker
                label="Makkah hotel"
                value={makkahStars}
                onChange={setMakkahStars}
              />
              <StarPicker
                label="Madinah hotel"
                value={madinahStars}
                onChange={setMadinahStars}
              />
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              {/* Departure city */}
              <div className="relative">
                <select
                  value={departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  className="h-12 min-w-37.5 appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-9 text-sm text-slate-700 transition hover:border-brand/40 focus:outline-none"
                  aria-label="Departure city"
                >
                  {departureCities.map((city) => (
                    <option key={city} value={city}>
                      {city === "All" ? "All cities" : city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Pax picker */}
              <PaxDropdown
                adults={adults}
                childCount={children}
                onAdults={setAdults}
                onChildren={setChildren}
              />

              {/* Search button */}
              <button
                type="button"
                onClick={handleSearch}
                className="ml-auto flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-strong active:scale-95"
              >
                <Search className="h-4 w-4" />
                Find packages
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <section className="section-shell py-10" aria-label="Package results">
        {/* Summary bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {applied.duration}-night packages
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {applied.city === "All"
                ? "All departure cities"
                : `Departing from ${applied.city}`}{" "}
              · {applied.adults} adult{applied.adults !== 1 ? "s" : ""}
              {applied.children > 0
                ? `, ${applied.children} child${applied.children !== 1 ? "ren" : ""}`
                : ""}{" "}
              · {totalPax} pax
              {(applied.makkahStars !== 0 || applied.madinahStars !== 0) && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {applied.makkahStars !== 0
                    ? `${applied.makkahStars}★ Makkah`
                    : "Any Makkah"}
                  {" · "}
                  {applied.madinahStars !== 0
                    ? `${applied.madinahStars}★ Madinah`
                    : "Any Madinah"}
                </span>
              )}
            </p>
          </div>
          <span className="rounded-full border border-brand/20 bg-brand/5 px-4 py-1 text-sm font-medium text-brand">
            {filtered.length} packages
          </span>
        </div>

        {/* Package cards */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-700">
              No packages available
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Try selecting a different departure city or check back soon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                nights={applied.duration}
                adults={applied.adults}
                childCount={applied.children}
                makkahStars={applied.makkahStars}
                madinahStars={applied.madinahStars}
              />
            ))}
          </div>
        )}

        {/* Duration quick-switch at bottom */}
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Compare durations for {totalPax} pax
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setSelectedDuration(d);
                  setApplied((prev) => ({ ...prev, duration: d }));
                }}
                className={`rounded-2xl border p-4 text-left transition hover:border-brand/40 hover:shadow-sm ${
                  applied.duration === d
                    ? "border-brand bg-brand/5 shadow-sm"
                    : "border-slate-100 bg-white"
                }`}
              >
                <p
                  className={`text-2xl font-extrabold tabular-nums ${
                    applied.duration === d
                      ? "text-brand-strong"
                      : "text-slate-800"
                  }`}
                >
                  {d}N
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{d} nights</p>
                {filtered.length > 0 &&
                  (() => {
                    const representative = filtered[0];
                    const p = priceForConfig(
                      representative,
                      d,
                      applied.adults,
                      applied.children,
                      applied.makkahStars,
                      applied.madinahStars,
                    );
                    return p ? (
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        from {representative.currency}{" "}
                        {p.perPersonTotal.toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          /person
                        </span>
                      </p>
                    ) : null;
                  })()}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
