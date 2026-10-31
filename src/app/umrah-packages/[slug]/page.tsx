import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  BedDouble,
  CalendarDays,
  MapPin,
  Moon,
  Plane,
  Users,
} from "lucide-react";

import type { PackageRow } from "@/app/api/packages/route";
import { Breadcrumbs } from "@/components/features/detail/breadcrumbs";
import {
  BookingCard,
  DetailLayout,
  DetailPage,
  DetailSection,
  DetailTitle,
  ENQUIRE_ID,
  FactGrid,
  InclusionLists,
  MobileBookingBar,
  SummaryRows,
  TrustNotes,
} from "@/components/features/detail/detail-kit";
import { PhotoGallery } from "@/components/features/detail/photo-gallery";
import { UmrahEnquiryForm } from "@/components/features/umrah/umrah-enquiry-form";
import { SectionHeader } from "@/components/shared/section-header";
import { StructuredData } from "@/components/shared/structured-data";
import {
  buildMetadata,
  createBreadcrumbSchema,
  createTouristTripSchema,
} from "@/lib/seo";
import {
  UMRAH_GALLERY,
  getPublishedUmrahPackageBySlug,
  getPublishedUmrahPackages,
  getUmrahPackagePath,
} from "@/lib/umrah-packages";
import {
  STAR_LABEL,
  type StarRating,
  configQuery,
  formatPax,
  priceForConfig,
  toStarRating,
} from "@/lib/umrah-pricing";

const TRUST_NOTES = [
  "No payment needed to enquire",
  "Visa processing support included",
  "An Umrah adviser replies within 24 hours",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function hotelLabel(stars: StarRating) {
  return stars === 0 ? "Any rating" : `${stars}★ ${STAR_LABEL[stars]}`;
}

function money(pkg: PackageRow, value: number) {
  return `${pkg.currency} ${value.toLocaleString()}`;
}

function RelatedPackageCard({
  pkg,
  query,
  nights,
}: {
  pkg: PackageRow;
  query: string;
  nights: number;
}) {
  const perPerson = priceForConfig(pkg, nights, 1, 0)?.perPersonTotal ?? pkg.basePrice;
  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:shadow-raised">
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <MapPin className="size-3.5" />
        From {pkg.departureCity}
      </p>
      <h3 className="mt-1 text-lg font-semibold leading-snug text-foreground">
        <Link
          href={`${getUmrahPackagePath(pkg.slug)}?${query}`}
          className="after:absolute after:inset-0 group-hover:text-brand"
        >
          {pkg.title}
        </Link>
      </h3>
      {pkg.subtitle ? <p className="mt-1 text-sm text-muted">{pkg.subtitle}</p> : null}
      <p className="mt-3 text-sm text-foreground">
        {pkg.makkahNights}N Makkah · {pkg.madinahNights}N Madinah
      </p>
      <div className="mt-auto pt-5 text-right">
        <p className="text-xs text-muted">{nights} nights from</p>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {money(pkg, perPerson)}
        </p>
        <p className="text-xs text-muted">per person</p>
      </div>
    </article>
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedUmrahPackageBySlug(slug);
  if (!result)
    return buildMetadata({
      title: "Package not found",
      description: "The requested Umrah package could not be found.",
      path: getUmrahPackagePath(slug),
      noIndex: true,
    });

  const { pkg, isDummy } = result;
  return buildMetadata({
    title: pkg.seoTitle,
    description: pkg.seoDescription,
    path: getUmrahPackagePath(pkg.slug),
    keywords: ["Umrah package", pkg.departureCity, "pilgrimage"],
    // Demo packages (no published rows in the database) must not be indexed.
    noIndex: isDummy,
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

  const [result, { packages }] = await Promise.all([
    getPublishedUmrahPackageBySlug(slug),
    getPublishedUmrahPackages(),
  ]);
  if (!result) notFound();
  const { pkg } = result;
  const packagePath = getUmrahPackagePath(pkg.slug);

  // Config from URL params (set by the configurator card link)
  const nights = Math.max(1, Number(sp.nights) || 14);
  const adults = Math.max(1, Number(sp.adults) || 2);
  const children = Math.max(0, Number(sp.children) || 0);
  const makkahStars = toStarRating(sp.makkahStars);
  const madinahStars = toStarRating(sp.madinahStars);
  const query = configQuery({ nights, adults, childCount: children, makkahStars, madinahStars });

  const pricing = priceForConfig(pkg, nights, adults, children, makkahStars, madinahStars);
  const totalAmount = pricing ? money(pkg, pricing.allPaxTotal) : money(pkg, pkg.basePrice);
  const totalNote = pricing
    ? `total for ${formatPax(adults, children)}`
    : "per person";
  const related = packages.filter((other) => other.id !== pkg.id).slice(0, 3);

  return (
    <DetailPage>
      <StructuredData
        data={[
          createTouristTripSchema({
            name: pkg.title,
            description: pkg.seoDescription,
            path: packagePath,
            price: pkg.basePrice,
            currency: pkg.currency,
            seatsAvailable: pkg.seatsAvailable,
            validFrom: pkg.createdAt,
            validThrough: pkg.startDate,
            touristType: "Pilgrims",
            itinerary: [
              `${pkg.makkahNights} nights in Makkah`,
              `${pkg.madinahNights} nights in Madinah`,
            ],
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Umrah Packages", path: "/umrah-packages" },
            { name: pkg.title, path: packagePath },
          ]),
        ]}
      />
      <div className="section-shell">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Umrah packages", href: "/umrah-packages" },
            { name: pkg.title },
          ]}
        />

        <DetailTitle
          title={pkg.title}
          subtitle={pkg.subtitle}
          badge={
            <span className="inline-flex rounded-full bg-gold/12 px-2.5 py-1 text-xs font-semibold text-gold-strong">
              Umrah package
            </span>
          }
          meta={
            <>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-muted" />
                From {pkg.departureCity}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Moon className="size-4 text-muted" />
                {pkg.makkahNights + pkg.madinahNights} nights
              </span>
              {pkg.seatsAvailable > 0 ? (
                <span className="font-semibold text-deal">
                  {pkg.seatsAvailable} seats left
                </span>
              ) : null}
            </>
          }
        />

        <PhotoGallery photos={UMRAH_GALLERY} />

        <DetailLayout
          aside={
            <BookingCard
              price={{
                label: pricing ? "Estimated total" : "from",
                amount: totalAmount,
                note: pricing ? (
                  <>
                    {money(pkg, pricing.perPersonTotal)} per person ·{" "}
                    {formatPax(adults, children)}
                  </>
                ) : (
                  "per person"
                ),
              }}
              footer={<TrustNotes notes={TRUST_NOTES} />}
            >
              <SummaryRows
                rows={[
                  {
                    label: "Nights",
                    value: pricing
                      ? `${nights} (${pricing.split.makkah} Makkah, ${pricing.split.madinah} Madinah)`
                      : nights,
                  },
                  { label: "Travellers", value: formatPax(adults, children) },
                  { label: "Makkah hotel", value: hotelLabel(makkahStars) },
                  { label: "Madinah hotel", value: hotelLabel(madinahStars) },
                ]}
              />
              <Link
                href={`/umrah-packages?${query}`}
                className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-strong"
              >
                Change options
              </Link>
            </BookingCard>
          }
        >
          <DetailSection title="Overview">
            <p className="text-base leading-7 text-foreground">{pkg.description}</p>
            <div className="mt-6">
              <FactGrid
                facts={[
                  { icon: CalendarDays, label: "Departs", value: formatDate(pkg.startDate) },
                  { icon: CalendarDays, label: "Returns", value: formatDate(pkg.endDate) },
                  {
                    icon: Moon,
                    label: "Package length",
                    value: `${pkg.makkahNights} nights Makkah + ${pkg.madinahNights} nights Madinah`,
                  },
                  { icon: Users, label: "Your group", value: formatPax(adults, children) },
                  ...(pkg.airlineNotes
                    ? [{ icon: Plane, label: "Flights", value: pkg.airlineNotes }]
                    : []),
                  ...(pkg.hotelSummary
                    ? [{ icon: BedDouble, label: "Hotels", value: pkg.hotelSummary }]
                    : []),
                ]}
              />
            </div>
          </DetailSection>

          {pricing ? (
            <DetailSection title="Your stay">
              <ol className="space-y-3">
                {[
                  { city: "Makkah", nights: pricing.split.makkah, stars: makkahStars },
                  { city: "Madinah", nights: pricing.split.madinah, stars: madinahStars },
                ]
                  .filter((leg) => leg.nights > 0)
                  .map((leg, i) => (
                    <li
                      key={leg.city}
                      className="flex items-center gap-4 rounded-xl border border-line px-4 py-3"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{leg.city}</p>
                        <p className="text-sm text-muted">{hotelLabel(leg.stars)} hotel</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-foreground">
                        {leg.nights} night{leg.nights !== 1 ? "s" : ""}
                      </p>
                    </li>
                  ))}
              </ol>
              <p className="mt-3 text-sm text-muted">
                Nights are split between the cities in the package&apos;s usual
                ratio. Your adviser confirms the exact hotels.
              </p>
            </DetailSection>
          ) : null}

          {pkg.inclusions.length > 0 || pkg.exclusions.length > 0 ? (
            <DetailSection title="What's included">
              <InclusionLists included={pkg.inclusions} excluded={pkg.exclusions} />
            </DetailSection>
          ) : null}

          <DetailSection title="Enquire about this package" id={ENQUIRE_ID}>
            <p className="mb-5 text-sm text-muted">
              Send us your details and an Umrah adviser will confirm hotels,
              flights and the final price for your group.
            </p>
            <div className="rounded-card border border-line p-5 sm:p-6">
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
          </DetailSection>
        </DetailLayout>
      </div>

      {related.length > 0 ? (
        <section className="section-shell mt-8 border-t border-line pt-12">
          <SectionHeader
            title="More Umrah packages"
            href={`/umrah-packages?${query}`}
            hrefLabel="See all"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((other) => (
              <RelatedPackageCard key={other.id} pkg={other} query={query} nights={nights} />
            ))}
          </div>
        </section>
      ) : null}

      <MobileBookingBar amount={totalAmount} note={totalNote} />
    </DetailPage>
  );
}
