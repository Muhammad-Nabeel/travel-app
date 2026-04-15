import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Moon,
  Plane,
  Star,
  Users,
  XCircle,
} from "lucide-react";

import type { PackageRow } from "@/app/api/packages/route";
import { UmrahEnquiryForm } from "@/components/features/umrah/umrah-enquiry-form";
import { buildMetadata } from "@/lib/seo";

// ─── Pricing helpers (mirrors umrah-configurator.tsx) ────────────────────────

const STAR_MULTIPLIER: Record<number, number> = {
  0: 1.0,
  3: 0.78,
  4: 1.0,
  5: 1.52,
};

const STAR_LABEL: Record<number, string> = {
  0: "Any",
  3: "Economy (3★)",
  4: "Standard (4★)",
  5: "Luxury (5★)",
};

function nightSplit(pkg: PackageRow, nights: number) {
  const total = pkg.makkahNights + pkg.madinahNights;
  if (total === 0) return { makkah: nights, madinah: 0 };
  const makkah = Math.round((pkg.makkahNights / total) * nights);
  return { makkah, madinah: nights - makkah };
}

function buildPricing(
  pkg: PackageRow,
  nights: number,
  adults: number,
  children: number,
  makkahStars: number,
  madinahStars: number,
) {
  const baseNights = pkg.makkahNights + pkg.madinahNights;
  if (baseNights === 0) return null;

  const split = nightSplit(pkg, nights);
  const baseRatePerNight = pkg.basePrice / baseNights;
  const makkahMult = STAR_MULTIPLIER[makkahStars] ?? 1;
  const madinahMult = STAR_MULTIPLIER[madinahStars] ?? 1;

  const perPersonTotal = Math.round(
    baseRatePerNight * makkahMult * split.makkah +
      baseRatePerNight * madinahMult * split.madinah,
  );
  const totalPax = adults + children;
  const allPaxTotal = perPersonTotal * totalPax;
  const perNightPerPerson = Math.round(
    (baseRatePerNight * makkahMult * split.makkah +
      baseRatePerNight * madinahMult * split.madinah) /
      nights,
  );
  return { perPersonTotal, allPaxTotal, perNightPerPerson, totalPax, split };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getPackage(slug: string): Promise<PackageRow | null> {
  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const res = await fetch(
      `${protocol}://${host}/api/packages/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as PackageRow & { ok?: boolean };
    if ("ok" in data && data.ok === false) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg)
    return buildMetadata({
      title: "Package not found",
      description: "The requested Umrah package could not be found.",
      path: `/umrah-packages/${slug}`,
    });
  return buildMetadata({
    title: pkg.title,
    description: pkg.subtitle ?? pkg.description,
    path: `/umrah-packages/${pkg.slug}`,
    keywords: ["Umrah package", pkg.departureCity, "pilgrimage"],
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UmrahPackageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const pkg = await getPackage(slug);
  if (!pkg) notFound();

  // Config from URL params (set by the configurator card link)
  const nights = Math.max(1, Number(sp.nights) || 14);
  const adults = Math.max(1, Number(sp.adults) || 2);
  const children = Math.max(0, Number(sp.children) || 0);
  const makkahStars = Number(sp.makkahStars) || 0;
  const madinahStars = Number(sp.madinahStars) || 0;

  const pricing = buildPricing(
    pkg,
    nights,
    adults,
    children,
    makkahStars,
    madinahStars,
  );

  const startDate = new Date(pkg.startDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endDate = new Date(pkg.endDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1">
      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          background: `
            linear-gradient(180deg,
              rgba(120,53,15,0.92) 0%,
              rgba(217,119,6,0.72) 35%,
              rgba(5,150,105,0.60) 70%,
              rgba(226,232,240,0.7) 100%
            )
          `,
        }}
      >
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

        <div className="section-shell relative z-10 py-12 pb-14">
          <Link
            href="/umrah-packages"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to packages
          </Link>

          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200/80">
            {pkg.departureCity}
          </p>
          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            {pkg.title}
          </h1>
          {pkg.subtitle && (
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
              {pkg.subtitle}
            </p>
          )}

          {/* Quick chips */}
          <div className="mt-6 flex flex-wrap gap-3">
            {pricing && (
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                <Moon className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-semibold text-white">
                  {pricing.split.makkah}N Makkah · {pricing.split.madinah}N
                  Madinah
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Users className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-semibold text-white">
                {adults} adult{adults !== 1 ? "s" : ""}
                {children > 0
                  ? `, ${children} child${children !== 1 ? "ren" : ""}`
                  : ""}
              </span>
            </div>
            {pkg.seatsAvailable > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/20 px-4 py-1.5 backdrop-blur-sm">
                <span className="text-sm font-semibold text-amber-200">
                  ⚡ {pkg.seatsAvailable} seats remaining
                </span>
              </div>
            )}
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                pkg.status === "PUBLISHED"
                  ? "border border-emerald-300/30 bg-emerald-400/20 text-emerald-200"
                  : "border border-amber-300/30 bg-amber-400/20 text-amber-200"
              }`}
            >
              {pkg.status.toLowerCase()}
            </span>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="section-shell py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── Left: Details ── */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Description */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-balance text-2xl font-extrabold tracking-tight text-slate-900">
                About this package
              </h2>
              <p className="leading-7 text-slate-600">{pkg.description}</p>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pkg.inclusions.length > 0 && (
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-balance text-2xl font-extrabold tracking-tight text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    What&apos;s included
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {pkg.inclusions.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-emerald-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 fill-emerald-200 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pkg.exclusions.length > 0 && (
                <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-balance text-2xl font-extrabold tracking-tight text-rose-800">
                    <XCircle className="h-5 w-5 text-rose-400" />
                    Not included
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {pkg.exclusions.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-rose-700"
                      >
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 fill-rose-100 text-rose-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Hotel & Airline info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pkg.hotelSummary && (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-balance text-lg font-extrabold tracking-tight text-slate-800">
                    Hotel summary
                  </h3>
                  <p className="text-sm leading-6 text-slate-700">
                    🏨 {pkg.hotelSummary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {makkahStars !== 0 && (
                      <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-700">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        Makkah: {STAR_LABEL[makkahStars] ?? `${makkahStars}★`}
                      </span>
                    )}
                    {madinahStars !== 0 && (
                      <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-700">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        Madinah:{" "}
                        {STAR_LABEL[madinahStars] ?? `${madinahStars}★`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {pkg.airlineNotes && (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-balance text-lg font-extrabold tracking-tight text-slate-800">
                    Flights
                  </h3>
                  <div className="flex items-start gap-2">
                    <Plane className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <p className="text-sm leading-6 text-slate-700">
                      {pkg.airlineNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Travel dates */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-balance text-lg font-extrabold tracking-tight text-slate-800">
                Travel dates
              </h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Departure
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {startDate}
                    </p>
                  </div>
                </div>
                <div className="w-px bg-slate-100 sm:block hidden" />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Return
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {endDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Duration
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {nights} nights · {pkg.makkahNights}N Makkah +{" "}
                      {pkg.madinahNights}N Madinah
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Pricing + Enquiry Form ── */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {/* Pricing summary */}
            {pricing && (
              <div className="rounded-3xl border border-brand/20 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Estimated price
                </p>
                <p className="mt-2 text-4xl font-extrabold tabular-nums text-brand-strong">
                  {pkg.currency} {pricing.allPaxTotal.toLocaleString()}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {pkg.currency} {pricing.perPersonTotal.toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    / person
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  ≈ {pkg.currency} {pricing.perNightPerPerson.toLocaleString()}
                  <span className="ml-0.5">/ night per person</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4 text-xs">
                  <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-slate-600">
                    {nights} nights
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-slate-600">
                    {adults} adult{adults !== 1 ? "s" : ""}
                    {children > 0
                      ? ` + ${children} child${children !== 1 ? "ren" : ""}`
                      : ""}
                  </span>
                  {makkahStars !== 0 && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700">
                      {makkahStars}★ Makkah
                    </span>
                  )}
                  {madinahStars !== 0 && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700">
                      {madinahStars}★ Madinah
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Enquiry form */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-balance text-3xl font-extrabold tracking-tight text-slate-900">
                Enquire now
              </h2>
              <p className="mb-5 text-sm text-slate-500">
                Fill in your details and we&apos;ll get back to you shortly.
              </p>
              <UmrahEnquiryForm
                pkg={pkg}
                nights={nights}
                adults={adults}
                childCount={children}
                makkahStars={makkahStars}
                madinahStars={madinahStars}
                estimatedTotal={pricing?.allPaxTotal ?? 0}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
