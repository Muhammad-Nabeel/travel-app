import { ViewItemTracker } from "@/components/analytics/view-item-tracker";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Clock, FileCheck2, Globe2 } from "lucide-react";

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
import { VisaEnquiryForm } from "@/components/features/visa/visa-enquiry-form";
import { StructuredData } from "@/components/shared/structured-data";
import {
  getStoredVisaCountries,
  type VisaCountryEntry,
} from "@/lib/admin-settings/visa-settings";
import {
  absoluteUrl,
  buildMetadata,
  createBreadcrumbSchema,
  createFAQSchema,
  createWebPageSchema,
  ORGANIZATION_ID_PATH,
} from "@/lib/seo";
import { findVisaBySlug, getVisaPath } from "@/lib/visa";
import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";

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

function detailsDescription(visa: VisaCountryEntry) {
  return `Apply for a ${visa.duration} ${visaLabel(visa.visaType)} to ${visa.country} with guided support and transparent pricing.`;
}

/** Numeric amount for schema.org Offer.price, e.g. "PKR 49,000" -> "49000". */
function offerPrice(value: string) {
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? match[0] : undefined;
}

async function getVisaBySlug(slug: string) {
  const items = await getStoredVisaCountries();
  const activeItems = items.filter((item) => item.isActive);
  return findVisaBySlug(activeItems, slug);
}

// Render each page on its first visit, then serve it from the ISR cache
// (metadata lands in <head>; admin saves revalidate the site).
export async function generateStaticParams() {
  return [];
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
    title: visa.seoTitle,
    description: visa.seoDescription,
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

  const brand = await getStoredBrandSettings();

  const pagePath = getVisaPath(visa.country, visa.visaType);

  return (
    <DetailPage>
      <ViewItemTracker
        itemId={slug}
        itemName={detailsTitle(visa)}
        itemCategory="visa"
        price={Number(offerPrice(visa.netCost) ?? 0)}
        currency="PKR"
      />
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
            serviceType: "Visa application assistance",
            provider: {
              "@type": "TravelAgency",
              "@id": absoluteUrl(ORGANIZATION_ID_PATH),
              name: brand.name,
            },
            areaServed: visa.country,
            offers: {
              "@type": "Offer",
              priceCurrency: "PKR",
              price: offerPrice(visa.netCost),
              url: absoluteUrl(pagePath),
            },
          },
          ...(visa.faqs.length > 0 ? [createFAQSchema(visa.faqs)] : []),
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
          <DetailSection title={`${visa.country} visa from Pakistan`}>
            <div className="space-y-3 text-sm leading-relaxed text-foreground">
              {visa.overview.split(/\n\s*\n/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </DetailSection>

          <DetailSection title="Visa details">
            <FactGrid
              facts={[
                { icon: Globe2, label: "Country", value: visa.country },
                { icon: FileCheck2, label: "Visa type", value: visaLabel(visa.visaType) },
                { icon: CalendarDays, label: "Length of stay", value: visa.duration },
                { icon: BadgeCheck, label: "Entry", value: visa.entry },
                { icon: Clock, label: "Processing time", value: visa.processingTime },
              ]}
            />
          </DetailSection>

          <DetailSection title={`Documents required for ${visa.country} visa`}>
            <CheckList items={visa.documents} />
          </DetailSection>

          <DetailSection title={`How to apply for a ${visa.country} visa`}>
            <ol className="space-y-3">
              {visa.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </DetailSection>

          {visa.faqs.length > 0 ? (
            <DetailSection title={`${visa.country} visa FAQs`}>
              <div className="divide-y divide-line rounded-card border border-line">
                {visa.faqs.map((faq) => (
                  <details key={faq.question} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                      <h3 className="inline">{faq.question}</h3>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </DetailSection>
          ) : null}

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
