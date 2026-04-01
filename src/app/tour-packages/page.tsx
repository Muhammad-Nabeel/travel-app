"use client";

import { useState } from "react";
import { MapPin, Star } from "lucide-react";

import {
  PackageSearchEngine,
  type TourType,
} from "@/components/features/home/package-search/package-search";
import { CustomerSupport } from "@/components/shared/customer-support";
import { tourPackageResults } from "@/lib/mock-data";

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < full ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
        />
      ))}
    </div>
  );
}

const TOUR_TYPE_COLORS: Record<string, string> = {
  luxury: "bg-amber-100 text-amber-800",
  cultural: "bg-blue-100 text-blue-800",
  adventure: "bg-orange-100 text-orange-800",
  family: "bg-green-100 text-green-800",
  religious: "bg-purple-100 text-purple-800",
  all: "bg-slate-100 text-slate-700",
};

export default function TourPackagesPage() {
  const [searchParams, setSearchParams] = useState<{
    destination: string;
    duration: string;
    adults: number;
    children: number;
    tourType: TourType;
  } | null>(null);

  // Filter results based on search params
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
    <main className="flex-1">
      {/* Hero search engine */}
      <PackageSearchEngine
        variant="hero"
        onSearch={(params) => setSearchParams(params)}
      />

      {/* Results section */}
      <section className="section-shell py-10" aria-label="Tour packages">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {searchParams
                ? `Packages to "${searchParams.destination || "Anywhere"}"`
                : "Featured Tour Packages"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredResults.length} package
              {filteredResults.length !== 1 ? "s" : ""} available
              {searchParams &&
                ` · ${searchParams.adults} adult${searchParams.adults !== 1 ? "s" : ""}${searchParams.children > 0 ? `, ${searchParams.children} child${searchParams.children !== 1 ? "ren" : ""}` : ""} · ${searchParams.duration} days`}
            </p>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-lg font-semibold text-slate-700">
              No packages found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your destination, duration, or tour type.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((pkg) => {
              const totalPrice = priceForPax(pkg);
              return (
                <article
                  key={pkg.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Colour band */}
                  <div className="h-2 w-full bg-linear-to-r from-amber-500 to-orange-400" />

                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TOUR_TYPE_COLORS[pkg.tourType] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {pkg.tourType}
                        </span>
                        <h3 className="mt-1.5 text-lg font-bold leading-snug text-slate-900">
                          {pkg.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{pkg.destination}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <StarRating rating={pkg.rating} />
                        <p className="mt-1 text-xs text-slate-400">
                          {pkg.reviews} reviews
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <p className="text-xs font-medium text-slate-500">
                      {pkg.duration} {pkg.duration === 1 ? "day" : "days"}
                    </p>

                    {/* Highlights */}
                    <ul className="flex flex-wrap gap-1.5">
                      {pkg.highlights.slice(0, 3).map((h) => (
                        <li
                          key={h}
                          className="rounded-full border border-slate-100 bg-slate-50 px-3 py-0.5 text-xs text-slate-600"
                        >
                          {h}
                        </li>
                      ))}
                      {pkg.highlights.length > 3 && (
                        <li className="rounded-full border border-slate-100 bg-slate-50 px-3 py-0.5 text-xs text-slate-500">
                          +{pkg.highlights.length - 3} more
                        </li>
                      )}
                    </ul>

                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {searchParams &&
                          searchParams.adults + searchParams.children > 1
                            ? `Total for ${searchParams.adults + searchParams.children} pax`
                            : "Per adult"}
                        </p>
                        <p className="text-2xl font-extrabold tabular-nums text-amber-700">
                          {pkg.currency}{" "}
                          <span className="text-3xl">
                            {totalPrice.toLocaleString()}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-95"
                      >
                        View package
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <CustomerSupport />
    </main>
  );
}
