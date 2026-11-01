"use client";

import { useState } from "react";

import {
  PackageSearchEngine,
  type TourType,
} from "@/components/features/home/package-search/package-search";
import { TourPackageCard } from "@/components/features/tour/tour-package-card";
import type { TourPackage } from "@/lib/tour-packages";
import { EmptyStateImage } from "@/components/shared/empty-state-image";

export function TourPackagesClient({
  packages,
  heroImage,
}: {
  packages: TourPackage[];
  heroImage: string;
}) {
  const [searchParams, setSearchParams] = useState<{
    destination: string;
    duration: string;
    adults: number;
    children: number;
    tourType: TourType;
  } | null>(null);

  const filteredResults = packages.filter((pkg) => {
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

  const priceForPax = (pkg: TourPackage) => {
    if (!searchParams) return pkg.pricePerAdult;
    return (
      pkg.pricePerAdult * searchParams.adults +
      pkg.pricePerChild * searchParams.children
    );
  };

  return (
    <div className="flex-1">
      <PackageSearchEngine
        variant="hero"
        heroImage={heroImage}
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
            <EmptyStateImage slot="emptyPackages" />
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
            {filteredResults.map((pkg) => (
              <TourPackageCard
                key={pkg.id}
                pkg={pkg}
                totalPrice={priceForPax(pkg)}
                travellers={
                  searchParams ? searchParams.adults + searchParams.children : 1
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
