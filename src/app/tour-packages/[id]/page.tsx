import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Star,
  Tag,
  Users,
} from "lucide-react";

import { TourEnquiryForm } from "@/components/features/tour/tour-enquiry-form";
import { StructuredData } from "@/components/shared/structured-data";
import { CATALOG_INDEXING, fitTitle } from "@/lib/seo-copy";
import {
  absoluteUrl,
  buildMetadata,
  createBreadcrumbSchema,
  createWebPageSchema,
} from "@/lib/seo";
import {
  type TourPackage,
  findTourPackageBySlug,
  getTourPackagePath,
  toTourPackageSlug,
} from "@/lib/tour-packages";

type TourPackagePageProps = {
  params: Promise<{ id: string }>;
};

function formatTourTypeLabel(type: string) {
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

function packageDescription(pkg: TourPackage) {
  return `Explore ${pkg.destination} with our ${pkg.duration}-day ${pkg.title} itinerary featuring ${pkg.highlights.slice(0, 2).join(" and ")}.`;
}

export async function generateMetadata({
  params,
}: TourPackagePageProps): Promise<Metadata> {
  const { id: slug } = await params;
  const pkg = findTourPackageBySlug(slug);

  if (!pkg) {
    return buildMetadata({
      title: "Tour package not found",
      description: "The requested tour package could not be found.",
      path: `/tour-packages/${slug}`,
      noIndex: true,
    });
  }

  const city = pkg.destination.split(",")[0].trim();

  return buildMetadata({
    title: fitTitle(
      `${pkg.title} – ${pkg.duration}-Day ${city} Package`,
      `${pkg.title} – ${pkg.duration}-Day Package`,
      pkg.title,
    ),
    description: packageDescription(pkg),
    path: getTourPackagePath(pkg.title),
    keywords: [pkg.destination, `${pkg.duration} day tour`, pkg.tourType],
    noIndex: !CATALOG_INDEXING.tourPackages,
  });
}

export default async function TourPackageDetailsPage({
  params,
}: TourPackagePageProps) {
  const { id: slug } = await params;
  const pkg = findTourPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  const packagePath = getTourPackagePath(pkg.title);
  const packageSlug = toTourPackageSlug(pkg.title);

  const perAdult = pkg.pricePerAdult.toLocaleString();
  const perChild = pkg.pricePerChild.toLocaleString();
  const estimatedForTwoAdults = (pkg.pricePerAdult * 2).toLocaleString();

  return (
    <div className="flex-1 bg-slate-50 pb-14">
      <StructuredData
        data={[
          createWebPageSchema({
            title: pkg.title,
            description: packageDescription(pkg),
            path: packagePath,
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Tour Packages", path: "/tour-packages" },
            { name: pkg.title, path: packagePath },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            name: pkg.title,
            description: packageDescription(pkg),
            itinerary: pkg.highlights,
            provider: {
              "@type": "TravelAgency",
              name: "Safar Umrah",
            },
            offers: {
              "@type": "Offer",
              priceCurrency: pkg.currency,
              price: pkg.pricePerAdult,
              url: absoluteUrl(packagePath),
            },
          },
        ]}
      />

      <section className="relative overflow-hidden bg-linear-to-r from-amber-700 via-orange-600 to-rose-500 py-14 text-white">
        <div className="section-shell relative z-10">
          <Link
            href="/tour-packages"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to packages
          </Link>

          <div className="mt-7 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              <Tag className="h-3.5 w-3.5" />
              {formatTourTypeLabel(pkg.tourType)} Tour
            </p>
            <h1 className="mt-4 text-balance text-4xl font-black sm:text-5xl">
              {pkg.title}
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/75">
              {packageSlug}
            </p>
            <p className="mt-3 flex items-center gap-2 text-white/90">
              <MapPin className="h-4 w-4" />
              {pkg.destination}
            </p>
            <p className="mt-4 text-base text-white/95 sm:text-lg">
              {packageDescription(pkg)}
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Package Highlights
          </h2>
          <ul className="mt-4 space-y-3">
            {pkg.highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-start gap-2 text-slate-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Pricing & Details
            </h2>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-amber-600" />
                  Duration
                </span>
                <strong className="text-slate-900">{pkg.duration} days</strong>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Rating
                </span>
                <strong className="text-slate-900">
                  {pkg.rating} ({pkg.reviews} reviews)
                </strong>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-600" />
                  Per adult
                </span>
                <strong className="text-slate-900">
                  {pkg.currency} {perAdult}
                </strong>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span>Per child</span>
                <strong className="text-slate-900">
                  {pkg.currency} {perChild}
                </strong>
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Estimate for 2 adults
              </p>
              <p className="mt-1 text-2xl font-black text-amber-800">
                {pkg.currency} {estimatedForTwoAdults}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900">
              Enquire now
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Share your travel details and our team will arrange this tour
              package for you.
            </p>
            <TourEnquiryForm pkg={pkg} />
          </div>
        </aside>
      </section>
    </div>
  );
}
