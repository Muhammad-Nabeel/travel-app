import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Star, Tag } from "lucide-react";

import { Breadcrumbs } from "@/components/features/detail/breadcrumbs";
import {
  BookingCard,
  CheckList,
  DetailLayout,
  DetailPage,
  DetailSection,
  DetailTitle,
  ENQUIRE_ID,
  FactGrid,
  MobileBookingBar,
  SummaryRows,
  TrustNotes,
} from "@/components/features/detail/detail-kit";
import { PhotoGallery } from "@/components/features/detail/photo-gallery";
import { TourEnquiryForm } from "@/components/features/tour/tour-enquiry-form";
import { TourPackageCard } from "@/components/features/tour/tour-package-card";
import { SectionHeader } from "@/components/shared/section-header";
import { tourPackageResults } from "@/lib/mock-data";
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
  getTourPackageGallery,
  getTourPackagePath,
} from "@/lib/tour-packages";

type TourPackagePageProps = {
  params: Promise<{ id: string }>;
};

function formatTourTypeLabel(type: string) {
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

const TRUST_NOTES = [
  "No payment needed to enquire",
  "Dates and hotels tailored to you",
  "A travel adviser replies within 24 hours",
];

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
  const fromPrice = `${pkg.currency} ${pkg.pricePerAdult.toLocaleString()}`;
  const related = tourPackageResults
    .filter((other) => other.id !== pkg.id)
    .sort(
      (a, b) =>
        Number(b.tourType === pkg.tourType) - Number(a.tourType === pkg.tourType),
    )
    .slice(0, 3);

  return (
    <DetailPage>
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

      <div className="section-shell">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Tour packages", href: "/tour-packages" },
            { name: pkg.title },
          ]}
        />

        <DetailTitle
          title={pkg.title}
          meta={
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-xs font-bold text-white">
                  {pkg.rating.toFixed(1)}
                  <Star className="size-3 fill-white" />
                </span>
                <span className="text-muted">{pkg.reviews} reviews</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-muted" />
                {pkg.destination}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-muted" />
                {pkg.duration} days
              </span>
            </>
          }
        />

        <PhotoGallery photos={getTourPackageGallery(pkg)} />

        <DetailLayout
          aside={
            <BookingCard
              price={{ label: "from", amount: fromPrice, note: "per adult" }}
              footer={<TrustNotes notes={TRUST_NOTES} />}
            >
              <SummaryRows
                rows={[
                  {
                    label: "Per child",
                    value: `${pkg.currency} ${pkg.pricePerChild.toLocaleString()}`,
                  },
                  {
                    label: "2 adults",
                    value: `${pkg.currency} ${(pkg.pricePerAdult * 2).toLocaleString()}`,
                  },
                  { label: "Duration", value: `${pkg.duration} days` },
                ]}
              />
            </BookingCard>
          }
        >
          <DetailSection title="Overview">
            <p className="text-base leading-7 text-foreground">
              {packageDescription(pkg)}
            </p>
            <div className="mt-6">
              <FactGrid
                facts={[
                  { icon: MapPin, label: "Destination", value: pkg.destination },
                  { icon: CalendarDays, label: "Duration", value: `${pkg.duration} days` },
                  {
                    icon: Tag,
                    label: "Tour type",
                    value: formatTourTypeLabel(pkg.tourType),
                  },
                  {
                    icon: Star,
                    label: "Guest rating",
                    value: `${pkg.rating.toFixed(1)} / 5 · ${pkg.reviews} reviews`,
                  },
                ]}
              />
            </div>
          </DetailSection>

          <DetailSection title="Highlights">
            <CheckList items={pkg.highlights} />
          </DetailSection>

          <DetailSection title="Enquire about this tour" id={ENQUIRE_ID}>
            <p className="mb-5 text-sm text-muted">
              Tell us when you&apos;d like to travel and how many of you are
              going. A travel adviser will confirm availability and the final
              price.
            </p>
            <div className="rounded-card border border-line p-5 sm:p-6">
              <TourEnquiryForm pkg={pkg} />
            </div>
          </DetailSection>
        </DetailLayout>
      </div>

      {related.length > 0 ? (
        <section className="section-shell mt-8 border-t border-line pt-12">
          <SectionHeader
            title="You may also like"
            href="/tour-packages"
            hrefLabel="All tour packages"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((other) => (
              <TourPackageCard key={other.id} pkg={other} compact />
            ))}
          </div>
        </section>
      ) : null}

      <MobileBookingBar amount={fromPrice} note="per adult" />
    </DetailPage>
  );
}
