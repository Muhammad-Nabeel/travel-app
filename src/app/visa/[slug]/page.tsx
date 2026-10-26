import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  FileCheck2,
  Globe2,
} from "lucide-react";

import { VisaEnquiryForm } from "@/components/features/visa/visa-enquiry-form";
import { StructuredData } from "@/components/shared/structured-data";
import {
  getStoredVisaCountries,
  type VisaCountryEntry,
} from "@/lib/admin-settings/visa-settings";
import { fitTitle } from "@/lib/seo-copy";
import {
  absoluteUrl,
  buildMetadata,
  createBreadcrumbSchema,
  createWebPageSchema,
} from "@/lib/seo";
import { findVisaBySlug, getVisaPath } from "@/lib/visa";

type VisaDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

function visaLabel(type: VisaCountryEntry["visaType"]) {
  return type === "e-visa" ? "e-Visa" : "Sticker Visa";
}

function detailsTitle(visa: VisaCountryEntry) {
  return `${visa.country} ${visaLabel(visa.visaType)}`;
}

function searchTitle(visa: VisaCountryEntry) {
  const label = visaLabel(visa.visaType);
  return fitTitle(
    `${visa.country} ${label} from Pakistan – Requirements & Fees`,
    `${visa.country} Visa from Pakistan – Requirements & Fees`,
    `${visa.country} ${label} – Requirements & Fees`,
    detailsTitle(visa),
  );
}

function searchDescription(visa: VisaCountryEntry) {
  const cost = visa.netCost ? ` Fees from ${visa.netCost}.` : "";
  const entry = /entry$/i.test(visa.entry) ? visa.entry.toLowerCase() : `${visa.entry} entry`;
  return `Apply for a ${visa.country} ${visaLabel(visa.visaType)} from Pakistan: ${visa.duration} stay, ${entry}.${cost} Document checklist and expert help with your application.`;
}

function detailsDescription(visa: VisaCountryEntry) {
  return `Apply for a ${visa.duration} ${visaLabel(visa.visaType)} to ${visa.country} with guided support and transparent pricing.`;
}

async function getVisaBySlug(slug: string) {
  const items = await getStoredVisaCountries();
  const activeItems = items.filter((item) => item.isActive);
  return findVisaBySlug(activeItems, slug);
}

export async function generateMetadata({
  params,
}: VisaDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const visa = await getVisaBySlug(slug);

  if (!visa) {
    return buildMetadata({
      title: "Visa option not found",
      description: "The requested visa option could not be found.",
      path: `/visa/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: searchTitle(visa),
    description: searchDescription(visa),
    path: getVisaPath(visa.country, visa.visaType),
    keywords: [visa.country, visaLabel(visa.visaType), "visa assistance"],
  });
}

export default async function VisaDetailsPage({
  params,
}: VisaDetailsPageProps) {
  const { slug } = await params;
  const visa = await getVisaBySlug(slug);

  if (!visa) {
    notFound();
  }

  const pagePath = getVisaPath(visa.country, visa.visaType);

  return (
    <div className="flex-1 bg-slate-50 pb-14">
      <StructuredData
        data={[
          createWebPageSchema({
            title: detailsTitle(visa),
            description: detailsDescription(visa),
            path: pagePath,
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Visa", path: "/visa" },
            { name: detailsTitle(visa), path: pagePath },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: detailsTitle(visa),
            description: detailsDescription(visa),
            provider: {
              "@type": "TravelAgency",
              name: "Safar Umrah",
            },
            areaServed: visa.country,
            offers: {
              "@type": "Offer",
              priceCurrency: "PKR",
              price: visa.netCost,
              url: absoluteUrl(pagePath),
            },
          },
        ]}
      />

      <section className="relative overflow-hidden bg-linear-to-r from-sky-700 via-blue-600 to-cyan-500 py-14 text-white">
        <div className="section-shell relative z-10">
          <Link
            href="/visa"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to visa options
          </Link>

          <div className="mt-7 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              <FileCheck2 className="h-3.5 w-3.5" />
              {visaLabel(visa.visaType)}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-black sm:text-5xl">
              {detailsTitle(visa)}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-white/90">
              <Globe2 className="h-4 w-4" />
              {visa.country}
            </p>
            <p className="mt-4 text-base text-white/95 sm:text-lg">
              {detailsDescription(visa)}
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Visa details</h2>

          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <p className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-sky-600" />
                Duration
              </span>
              <strong>{visa.duration}</strong>
            </p>
            <p className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-sky-600" />
                Entry type
              </span>
              <strong>{visa.entry}</strong>
            </p>
            <p className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span>Per person cost</span>
              <strong>{visa.perPersonCost}</strong>
            </p>
            <p className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span>Service fee</span>
              <strong>{visa.serviceFee}</strong>
            </p>
          </div>

          <div className="mt-5 rounded-2xl bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Net cost
            </p>
            <p className="mt-1 text-2xl font-black text-sky-800">
              {visa.netCost}
            </p>
          </div>
        </article>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Enquire now
          </h2>
          <p className="mb-5 text-sm text-slate-500">
            Share your details and we will help process your {visa.country} visa
            request.
          </p>
          <VisaEnquiryForm visa={visa} />
        </aside>
      </section>
    </div>
  );
}
