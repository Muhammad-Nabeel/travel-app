import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, FileCheck2, Globe2 } from "lucide-react";

import { Breadcrumbs } from "@/components/features/detail/breadcrumbs";
import {
  BookingCard,
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

const TRUST_NOTES = [
  "No payment needed to enquire",
  "Document checklist reviewed by an adviser",
  "We reply within 24 hours",
];

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
    <DetailPage>
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

      <div className="section-shell">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Visa", href: "/visa" },
            { name: detailsTitle(visa) },
          ]}
        />

        <DetailTitle
          title={detailsTitle(visa)}
          subtitle={detailsDescription(visa)}
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
              <FileCheck2 className="size-3.5" />
              {visaLabel(visa.visaType)}
            </span>
          }
        />

        <DetailLayout
          aside={
            <BookingCard
              price={{ label: "Total cost", amount: visa.netCost, note: "per person" }}
              ctaLabel="Apply now"
              footer={<TrustNotes notes={TRUST_NOTES} />}
            >
              <SummaryRows
                rows={[
                  { label: "Visa fee", value: visa.perPersonCost },
                  { label: "Service fee", value: visa.serviceFee },
                ]}
              />
            </BookingCard>
          }
        >
          <DetailSection title="Visa details">
            <FactGrid
              facts={[
                { icon: Globe2, label: "Country", value: visa.country },
                { icon: FileCheck2, label: "Visa type", value: visaLabel(visa.visaType) },
                { icon: CalendarDays, label: "Length of stay", value: visa.duration },
                { icon: BadgeCheck, label: "Entry", value: visa.entry },
              ]}
            />
          </DetailSection>

          <DetailSection title="Apply with an adviser" id={ENQUIRE_ID}>
            <p className="mb-5 text-sm text-muted">
              Share your details and we will help process your {visa.country}{" "}
              visa request.
            </p>
            <div className="rounded-card border border-line p-5 sm:p-6">
              <VisaEnquiryForm visa={visa} />
            </div>
          </DetailSection>
        </DetailLayout>
      </div>

      <MobileBookingBar amount={visa.netCost} note="per person" ctaLabel="Apply now" />
    </DetailPage>
  );
}
