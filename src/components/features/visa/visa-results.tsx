"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";

import { VisaSearchEngine } from "@/components/features/visa/visa-search";
import type {
  VisaCountryEntry,
  VisaType,
} from "@/lib/admin-settings/visa-settings";
import { getVisaPath } from "@/lib/visa";

type SearchVisaType = VisaType | "any";

type VisaResultsProps = {
  results: VisaCountryEntry[];
  countryOptions: string[];
  popularCountries: string[];
};

type SearchFilters = {
  visaType: SearchVisaType;
  applyingFor: string;
  adults: number;
  children: number;
};

const DEFAULT_FILTERS: SearchFilters = {
  visaType: "any",
  applyingFor: "",
  adults: 1,
  children: 0,
};

function formatVisaTitle(
  visaType: VisaType,
  country: string,
  duration: string,
) {
  const label = visaType === "e-visa" ? "e-Visa" : "Sticker Visa";
  return `${duration} ${label} - ${country}`;
}

function getCountryBadge(code: string, country: string) {
  const safeCode = code.trim();
  if (safeCode.length >= 2) {
    return safeCode.slice(0, 2).toUpperCase();
  }
  return country.trim().slice(0, 2).toUpperCase();
}

export function VisaResults({
  results,
  countryOptions,
  popularCountries,
}: VisaResultsProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const filteredResults = useMemo(() => {
    const query = filters.applyingFor.trim().toLowerCase();

    return results.filter((item) => {
      if (filters.visaType !== "any" && item.visaType !== filters.visaType) {
        return false;
      }
      if (query && !item.country.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [filters, results]);

  return (
    <>
      <VisaSearchEngine
        countryOptions={countryOptions}
        popularCountries={popularCountries}
        onSearch={(params) => setFilters(params)}
      />

      <section className="section-shell py-10" aria-label="Visa results">
        <div className="text-sm font-semibold text-slate-500">
          {filteredResults.length} Visa Options Found
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <div className="space-y-4">
            {filteredResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                No visa options yet. Add countries in the admin visa settings.
              </div>
            ) : (
              filteredResults.map((visa, index) => (
                <article
                  key={`${visa.country}-${visa.visaType}-${index}`}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-emerald-400 text-xs font-semibold text-white shadow-sm">
                    {getCountryBadge(visa.code, visa.country)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-slate-900">
                      {formatVisaTitle(
                        visa.visaType,
                        visa.country,
                        visa.duration,
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {visa.duration} | {visa.entry}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:min-w-[220px]">
                    <div className="flex items-center justify-between gap-4">
                      <span>Per person cost</span>
                      <span className="font-semibold text-slate-900">
                        {visa.perPersonCost}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-4">
                      <span>Service Fee</span>
                      <span className="font-semibold text-slate-900">
                        {visa.serviceFee}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-700">
                      {visa.netCost}
                    </p>
                    <p className="text-xs font-semibold text-blue-600">
                      Net cost
                    </p>
                    <Link
                      href={getVisaPath(visa.country, visa.visaType)}
                      className="mt-2 inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      View details
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-blue-50/80 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Need help with your visa?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Our support team is just a WhatsApp message away. Chat with us
                  for guidance, document support, or updates.
                </p>
              </div>
              <div className="hidden h-16 w-16 items-center justify-center rounded-full bg-white text-3xl font-semibold text-blue-500 shadow-sm sm:flex">
                ?
              </div>
            </div>

            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" />
              Chat Now
            </button>
          </aside>
        </div>
      </section>
    </>
  );
}
