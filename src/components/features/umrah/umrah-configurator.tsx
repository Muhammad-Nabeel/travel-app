"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  BedDouble,
  Check,
  ChevronDown,
  ChevronLeft,
  MapPin,
  Minus,
  Plus,
  Star,
} from "lucide-react";

import type { PackageRow } from "@/app/api/packages/route";
import {
  DURATIONS,
  type Duration,
  STAR_LABEL,
  STAR_OPTIONS,
  type StarRating,
  configQuery,
  formatPax,
  nightSplit,
  priceForConfig,
} from "@/lib/umrah-pricing";
import { ProductTabs } from "@/components/features/home/product-tabs";
import { EmptyStateImage } from "@/components/shared/empty-state-image";

// ─── Types ──────────────────────────────────────────────────────────────────

export type UmrahConfig = {
  duration: Duration;
  adults: number;
  children: number;
  city: string;
  makkahStars: StarRating;
  madinahStars: StarRating;
};

type Props = {
  packages: PackageRow[];
  initial: UmrahConfig;
  /** Hero banner from Admin → Media → Page Banners. */
  heroImage: string;
};

const STEPS = [
  { id: "trip", label: "Trip & travellers" },
  { id: "makkah", label: "Makkah hotel" },
  { id: "madinah", label: "Madinah hotel" },
  { id: "review", label: "Review" },
] as const;

const STAR_CHOICES: StarRating[] = [0, ...STAR_OPTIONS];

const STAR_HINT: Record<StarRating, string> = {
  0: "Best available price",
  3: "Comfortable, a short walk or shuttle away",
  4: "Close to the Haram, good amenities",
  5: "Closest to the Haram, premium service",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function matchingPackages(packages: PackageRow[], city: string) {
  return packages.filter(
    (p) => p.status === "PUBLISHED" && (city === "All" || p.departureCity === city),
  );
}

/** Cheapest per-person price for a configuration across the given packages. */
function cheapest(packages: PackageRow[], config: UmrahConfig) {
  let best: { amount: number; currency: string } | null = null;
  for (const pkg of packages) {
    const price = priceForConfig(
      pkg,
      config.duration,
      1,
      0,
      config.makkahStars,
      config.madinahStars,
    );
    if (price && (!best || price.perPersonTotal < best.amount)) {
      best = { amount: price.perPersonTotal, currency: pkg.currency };
    }
  }
  return best;
}

function hotelLabel(stars: StarRating) {
  return stars === 0 ? "Any rating" : `${stars}★ ${STAR_LABEL[stars]}`;
}

function money(value: { amount: number; currency: string } | null) {
  return value ? `${value.currency} ${value.amount.toLocaleString()}` : "—";
}

// ─── Small controls ─────────────────────────────────────────────────────────

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const buttonClass =
    "flex size-10 items-center justify-center rounded-full border border-line text-foreground transition hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-35";
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          className={buttonClass}
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-6 text-center text-base font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className={buttonClass}
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function StarTiles({
  name,
  value,
  onChange,
  priceFor,
}: {
  name: string;
  value: StarRating;
  onChange: (v: StarRating) => void;
  priceFor: (stars: StarRating) => string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-3 sm:grid-cols-2">
      {STAR_CHOICES.map((stars) => {
        const selected = value === stars;
        return (
          <button
            key={stars}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(stars)}
            className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition ${
              selected
                ? "border-brand bg-brand-soft ring-1 ring-brand"
                : "border-line bg-white hover:border-foreground/40"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {stars === 0 ? (
                "Any rating"
              ) : (
                <>
                  <span className="flex" aria-hidden>
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-gold text-gold" />
                    ))}
                  </span>
                  {STAR_LABEL[stars]}
                  <span className="sr-only">{stars} star</span>
                </>
              )}
            </span>
            <span className="mt-1 text-xs text-muted">{STAR_HINT[stars]}</span>
            <span className="mt-3 text-sm text-foreground">
              from <strong className="tabular-nums">{priceFor(stars)}</strong>
              <span className="text-muted"> pp</span>
            </span>
            {selected ? (
              <Check className="absolute right-3 top-3 size-5 text-brand" strokeWidth={2.5} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// ─── Package result card ────────────────────────────────────────────────────

function PackageCard({ pkg, config }: { pkg: PackageRow; config: UmrahConfig }) {
  const pricing = priceForConfig(
    pkg,
    config.duration,
    config.adults,
    config.children,
    config.makkahStars,
    config.madinahStars,
  );
  if (!pricing) return null;

  const split = nightSplit(pkg, config.duration);
  const detailHref =
    `/umrah-packages/${pkg.slug}?` +
    configQuery({
      nights: config.duration,
      adults: config.adults,
      childCount: config.children,
      makkahStars: config.makkahStars,
      madinahStars: config.madinahStars,
    });

  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-white transition hover:shadow-raised sm:flex-row">
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-3.5" />
          From {pkg.departureCity}
        </p>
        <div>
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            <Link href={detailHref} className="after:absolute after:inset-0 group-hover:text-brand">
              {pkg.title}
            </Link>
          </h3>
          {pkg.subtitle ? <p className="mt-0.5 text-sm text-muted">{pkg.subtitle}</p> : null}
        </div>

        <p className="text-sm font-medium text-foreground">
          {split.makkah} nights Makkah
          {split.madinah > 0 ? ` · ${split.madinah} nights Madinah` : ""}
        </p>
        {pkg.hotelSummary ? (
          <p className="flex items-start gap-1.5 text-sm text-muted">
            <BedDouble className="mt-0.5 size-4 shrink-0" />
            {pkg.hotelSummary}
          </p>
        ) : null}

        {pkg.inclusions.length > 0 ? (
          <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {pkg.inclusions.slice(0, 4).map((inc) => (
              <li key={inc} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="size-4 shrink-0 text-success" />
                {inc}
              </li>
            ))}
          </ul>
        ) : null}
        {pkg.inclusions.length > 4 ? (
          <p className="text-xs text-muted">+{pkg.inclusions.length - 4} more included</p>
        ) : null}
      </div>

      <div className="flex flex-row items-end justify-between gap-4 border-t border-line p-5 sm:w-60 sm:flex-col sm:items-end sm:border-l sm:border-t-0">
        <div className="sm:text-right">
          {pkg.seatsAvailable > 0 ? (
            <p className="mb-2 text-xs font-semibold text-deal">
              {pkg.seatsAvailable} seats left
            </p>
          ) : null}
          <p className="text-xs text-muted">
            {config.duration} nights · {formatPax(config.adults, config.children)}
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {pkg.currency} {pricing.allPaxTotal.toLocaleString()}
          </p>
          <p className="text-xs text-muted">
            {pkg.currency} {pricing.perPersonTotal.toLocaleString()} per person
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-brand-strong">
          View details
        </span>
      </div>
    </article>
  );
}

// ─── Main configurator ──────────────────────────────────────────────────────

export function UmrahConfigurator({ packages, initial, heroImage }: Props) {
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(0);
  const [draft, setDraft] = useState<UmrahConfig>(initial);
  const [applied, setApplied] = useState<UmrahConfig>(initial);
  const resultsRef = useRef<HTMLElement>(null);

  const departureCities = useMemo(() => {
    const cities = Array.from(new Set(packages.map((p) => p.departureCity))).sort();
    return ["All", ...cities];
  }, [packages]);

  const draftMatches = useMemo(
    () => matchingPackages(packages, draft.city),
    [packages, draft.city],
  );
  const filtered = useMemo(
    () => matchingPackages(packages, applied.city),
    [packages, applied.city],
  );

  const update = (patch: Partial<UmrahConfig>) => setDraft((d) => ({ ...d, ...patch }));

  function goTo(next: number) {
    setStep(next);
    setVisited((v) => Math.max(v, next));
  }

  function showPackages() {
    setApplied(draft);
    const query = configQuery({
      nights: draft.duration,
      adults: draft.adults,
      childCount: draft.children,
      makkahStars: draft.makkahStars,
      madinahStars: draft.madinahStars,
    });
    const city = draft.city !== "All" ? `&city=${encodeURIComponent(draft.city)}` : "";
    window.history.replaceState(null, "", `?${query}${city}`);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const draftFrom = cheapest(draftMatches, draft);
  const draftPax = draft.adults + draft.children;
  const isLastStep = step === STEPS.length - 1;

  const summaryRows = [
    { label: "Duration", value: `${draft.duration} nights`, step: 0 },
    { label: "Departing from", value: draft.city === "All" ? "Any city" : draft.city, step: 0 },
    { label: "Travellers", value: formatPax(draft.adults, draft.children), step: 0 },
    { label: "Makkah hotel", value: hotelLabel(draft.makkahStars), step: 1 },
    { label: "Madinah hotel", value: hotelLabel(draft.madinahStars), step: 2 },
  ];

  return (
    <div className="flex-1">
      {/* ── Hero ── */}
      <section className="relative isolate" aria-label="Plan your Umrah">
        <div className="absolute inset-x-0 top-0 -z-10 h-[340px] overflow-hidden sm:h-[380px]">
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="100vw"
            fetchPriority="high"
            loading="eager"
            className="object-cover object-[center_60%]"
          />
          <div className="absolute inset-0 bg-linear-to-b from-navy/60 via-navy/35 to-navy/10" />
        </div>

        <div className="section-shell pb-6 pt-12 sm:pt-16">
          <div className="mx-auto mb-8 max-w-3xl text-center text-white">
            <h1 className="display-font text-balance text-4xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl">
              Plan your Umrah
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)] sm:text-lg">
              Choose your nights, travellers and hotels. See the price for your
              group as you go.
            </p>
          </div>

          {/* ── Stepper card ── */}
          <div className="overflow-hidden rounded-card border border-line bg-white shadow-raised">
            <ProductTabs active="umrah" className="" />
            <ol className="flex overflow-x-auto border-b border-line px-2 sm:px-4">
              {STEPS.map((s, i) => {
                const active = i === step;
                const done = !active && i <= visited;
                return (
                  <li key={s.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={active ? "step" : undefined}
                      className={`flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold transition sm:px-4 ${
                        active
                          ? "border-brand text-brand"
                          : "border-transparent text-muted hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-xs ${
                          active
                            ? "bg-brand text-white"
                            : done
                              ? "bg-success text-white"
                              : "bg-subtle text-muted"
                        }`}
                      >
                        {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
              <div className="p-5 sm:p-6">
                {step === 0 ? (
                  <div className="space-y-6">
                    <fieldset>
                      <legend className="mb-3 text-sm font-semibold text-foreground">
                        How many nights?
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {DURATIONS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            aria-pressed={draft.duration === d}
                            onClick={() => update({ duration: d })}
                            className={`h-11 rounded-full border px-5 text-sm font-semibold transition ${
                              draft.duration === d
                                ? "border-brand bg-brand-soft text-brand"
                                : "border-line bg-white text-foreground hover:border-foreground/40"
                            }`}
                          >
                            {d} nights
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <div>
                      <label
                        htmlFor="umrah-city"
                        className="mb-2 block text-sm font-semibold text-foreground"
                      >
                        Departing from
                      </label>
                      <div className="relative sm:max-w-xs">
                        <select
                          id="umrah-city"
                          value={draft.city}
                          onChange={(e) => update({ city: e.target.value })}
                          className="h-12 w-full appearance-none rounded-lg border border-line bg-white pl-4 pr-10 text-sm text-foreground transition hover:border-foreground/40"
                        >
                          {departureCities.map((city) => (
                            <option key={city} value={city}>
                              {city === "All" ? "Any city" : city}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                      </div>
                    </div>

                    <fieldset className="sm:max-w-sm">
                      <legend className="text-sm font-semibold text-foreground">Travellers</legend>
                      <div className="divide-y divide-line">
                        <Counter
                          label="Adults"
                          hint="Age 12+"
                          value={draft.adults}
                          min={1}
                          max={20}
                          onChange={(adults) => update({ adults })}
                        />
                        <Counter
                          label="Children"
                          hint="Under 12"
                          value={draft.children}
                          min={0}
                          max={12}
                          onChange={(children) => update({ children })}
                        />
                      </div>
                    </fieldset>
                  </div>
                ) : null}

                {step === 1 || step === 2 ? (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {step === 1 ? "Your hotel in Makkah" : "Your hotel in Madinah"}
                    </h2>
                    <p className="mb-4 mt-1 text-sm text-muted">
                      Prices are per person for {draft.duration} nights. Your
                      adviser confirms the exact hotel.
                    </p>
                    <StarTiles
                      name={step === 1 ? "Makkah hotel rating" : "Madinah hotel rating"}
                      value={step === 1 ? draft.makkahStars : draft.madinahStars}
                      onChange={(stars) =>
                        update(step === 1 ? { makkahStars: stars } : { madinahStars: stars })
                      }
                      priceFor={(stars) =>
                        money(
                          cheapest(
                            draftMatches,
                            step === 1
                              ? { ...draft, makkahStars: stars }
                              : { ...draft, madinahStars: stars },
                          ),
                        )
                      }
                    />
                  </div>
                ) : null}

                {isLastStep ? (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Check your choices</h2>
                    <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
                      {summaryRows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                          <dt className="text-sm text-muted">{row.label}</dt>
                          <dd className="flex items-center gap-3 text-sm font-semibold text-foreground">
                            {row.value}
                            <button
                              type="button"
                              onClick={() => goTo(row.step)}
                              className="text-sm font-semibold text-brand hover:text-brand-strong"
                              aria-label={`Edit ${row.label.toLowerCase()}`}
                            >
                              Edit
                            </button>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => goTo(step - 1)}
                      className="inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm font-semibold text-foreground transition hover:bg-subtle"
                    >
                      <ChevronLeft className="size-4" />
                      Back
                    </button>
                  ) : (
                    <span />
                  )}
                  {isLastStep ? (
                    <button
                      type="button"
                      onClick={showPackages}
                      className="h-12 rounded-full bg-brand px-7 text-base font-semibold text-white transition hover:bg-brand-strong"
                    >
                      Show {draftMatches.length} package{draftMatches.length !== 1 ? "s" : ""}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={showPackages}
                        className="hidden h-11 rounded-full px-4 text-sm font-semibold text-brand transition hover:bg-brand-soft sm:block"
                      >
                        Skip to packages
                      </button>
                      <button
                        type="button"
                        onClick={() => goTo(step + 1)}
                        className="h-12 rounded-full bg-brand px-7 text-base font-semibold text-white transition hover:bg-brand-strong"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Running summary */}
              <aside
                aria-label="Price summary"
                className="border-t border-line bg-subtle p-5 sm:p-6 md:border-l md:border-t-0"
              >
                <p className="text-sm font-semibold text-foreground">Your Umrah</p>
                <dl className="mt-3 hidden space-y-2 text-sm md:block">
                  {summaryRows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3">
                      <dt className="text-muted">{row.label}</dt>
                      <dd className="text-right font-medium text-foreground">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-2 md:mt-5 md:border-t md:border-line md:pt-5" aria-live="polite">
                  <p className="text-sm text-muted">from</p>
                  <p className="text-[28px] font-bold leading-tight tabular-nums text-foreground">
                    {money(draftFrom)}
                  </p>
                  <p className="text-sm text-muted">per person</p>
                  {draftFrom && draftPax > 1 ? (
                    <p className="mt-2 text-sm text-foreground">
                      About{" "}
                      <strong className="tabular-nums">
                        {money({ ...draftFrom, amount: draftFrom.amount * draftPax })}
                      </strong>{" "}
                      for {draftPax} travellers
                    </p>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <section
        ref={resultsRef}
        className="section-shell scroll-mt-24 py-10"
        aria-label="Package results"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            {applied.duration}-night Umrah packages
          </h2>
          <p className="mt-1 text-sm text-muted">
            {filtered.length} package{filtered.length !== 1 ? "s" : ""} ·{" "}
            {applied.city === "All" ? "all departure cities" : `from ${applied.city}`} ·{" "}
            {formatPax(applied.adults, applied.children)} · Makkah{" "}
            {hotelLabel(applied.makkahStars).toLowerCase()} · Madinah{" "}
            {hotelLabel(applied.madinahStars).toLowerCase()}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-subtle px-6 py-16 text-center">
            <EmptyStateImage slot="emptyPackages" />
            <p className="text-lg font-semibold text-foreground">No packages from this city yet</p>
            <p className="mt-1 text-sm text-muted">
              Try another departure city, or check back soon.
            </p>
            <button
              type="button"
              onClick={() => {
                update({ city: "All" });
                setApplied((a) => ({ ...a, city: "All" }));
              }}
              className="mt-5 rounded-full border border-line bg-white px-5 py-2 text-sm font-semibold text-foreground transition hover:shadow-card"
            >
              Show all cities
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} config={applied} />
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-foreground">Compare lengths of stay</h3>
            <p className="mt-1 text-sm text-muted">
              Lowest price per person for {formatPax(applied.adults, applied.children)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DURATIONS.map((d) => {
                const from = cheapest(filtered, { ...applied, duration: d });
                const active = applied.duration === d;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      update({ duration: d });
                      setApplied((prev) => ({ ...prev, duration: d }));
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-brand bg-brand-soft ring-1 ring-brand"
                        : "border-line bg-white hover:border-foreground/40"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${active ? "text-brand" : "text-foreground"}`}>
                      {d} nights
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                      {money(from)}
                    </p>
                    <p className="text-xs text-muted">per person</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
