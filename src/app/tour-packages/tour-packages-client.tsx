"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Check, MapPin, Star } from "lucide-react";

import {
  PackageSearchEngine,
  type TourType,
} from "@/components/features/home/package-search/package-search";
import { tourPackageResults } from "@/lib/mock-data";
import { getTourPackagePath } from "@/lib/tour-packages";

export function TourPackagesClient() {
  const [searchParams, setSearchParams] = useState<{
    destination: string;
    duration: string;
    adults: number;
    children: number;
    tourType: TourType;
  } | null>(null);

  const filteredResults = tourPackageResults.filter((pkg) => {
    if (!searchParams) return true;

    const matchesDestination =
      !searchParams.destination ||
      pkg.destination
        .toLowerCase()
        .includes(searchParams.destination.toLowerCase());

    const matchesDuration =
      !searchParams.duration ||
      pkg.duration <= parseInt(searchParams.duration, 10) + 3;

    const matchesType =
      searchParams.tourType === "all" || pkg.tourType === searchParams.tourType;

    return matchesDestination && matchesDuration && matchesType;
  });

  const priceForPax = (pkg: (typeof tourPackageResults)[number]) => {
    if (!searchParams) return pkg.pricePerAdult * 2;
    return (
      pkg.pricePerAdult * searchParams.adults +
      pkg.pricePerChild * searchParams.children
    );
  };

  return (
    <div className="flex-1">
      <PackageSearchEngine
        variant="hero"
        onSearch={(params) => setSearchParams(params)}
      />

      <section className="section-shell py-10" aria-label="Tour packages">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
              {searchParams
                ? `Packages to ${searchParams.destination || "anywhere"}`
                : "Featured tour packages"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {filteredResults.length} package
              {filteredResults.length !== 1 ? "s" : ""} available
              {searchParams &&
                ` · ${searchParams.adults} adult${searchParams.adults !== 1 ? "s" : ""}${searchParams.children > 0 ? `, ${searchParams.children} child${searchParams.children !== 1 ? "ren" : ""}` : ""} · ${searchParams.duration} days`}
            </p>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="rounded-2xl border border-line bg-subtle px-6 py-16 text-center">
            <p className="text-lg font-semibold text-foreground">
              No packages match your search
            </p>
            <p className="mt-1 text-sm text-muted">
              Try a different destination, duration or tour type.
            </p>
            <button
              type="button"
              onClick={() => setSearchParams(null)}
              className="mt-5 rounded-full border border-line bg-white px-5 py-2 text-sm font-semibold text-foreground transition hover:shadow-card"
            >
              Show all packages
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((pkg) => {
              const totalPrice = priceForPax(pkg);
              const travellers = searchParams
                ? searchParams.adults + searchParams.children
                : 1;
              return (
                <article
                  key={pkg.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-raised"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-brand to-navy">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pkg.image}
                      alt={pkg.destination}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-foreground shadow-card">
                      {pkg.tourType}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold leading-snug text-foreground">
                      <Link
                        href={getTourPackagePath(pkg.title)}
                        className="after:absolute after:inset-0 group-hover:text-brand"
                      >
                        {pkg.title}
                      </Link>
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <MapPin className="size-3.5 shrink-0" />
                      {pkg.destination}
                      <span aria-hidden>·</span>
                      <CalendarDays className="size-3.5 shrink-0" />
                      {pkg.duration} {pkg.duration === 1 ? "day" : "days"}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-xs font-bold text-white">
                        {pkg.rating.toFixed(1)}
                        <Star className="size-3 fill-white" />
                      </span>
                      <span className="text-xs text-muted">
                        {pkg.reviews} reviews
                      </span>
                    </div>

                    <ul className="mt-4 space-y-1.5">
                      {pkg.highlights.slice(0, 3).map((h) => (
                        <li
                          key={h}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <Check className="size-4 shrink-0 text-success" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      {pkg.highlights.length > 3 ? (
                        <span className="text-xs text-muted">
                          +{pkg.highlights.length - 3} more included
                        </span>
                      ) : (
                        <span />
                      )}
                      <div className="text-right">
                        <p className="text-xs text-muted">
                          {travellers > 1 ? `Total for ${travellers} travellers` : "from"}
                        </p>
                        <p className="text-2xl font-bold tabular-nums text-foreground">
                          {pkg.currency} {totalPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted">
                          {travellers > 1 ? "includes taxes" : "per adult"}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
