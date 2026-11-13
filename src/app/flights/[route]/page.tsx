import type { Metadata } from "next";
import Link from "next/link";
import { throwIfDatabaseUnavailable } from "@/lib/db";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Clock,
  FileCheck2,
  MessageCircle,
  Phone,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Route as RouteIcon,
} from "lucide-react";

import { Breadcrumbs } from "@/components/features/detail/breadcrumbs";
import {
  CheckList,
  DetailLayout,
  DetailPage,
  DetailSection,
  DetailTitle,
  FactGrid,
  MobileBookingBar,
  TrustNotes,
} from "@/components/features/detail/detail-kit";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { BrandIcon } from "@/components/shared/brand-icon";
import { StructuredData } from "@/components/shared/structured-data";
import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import {
  getPrimaryPhone,
  getStoredSupportContactSettings,
  getWhatsappLink,
} from "@/lib/admin-settings/support-contact-settings";
import { getStoredVisaCountries } from "@/lib/admin-settings/visa-settings";
import { getVisaPath } from "@/lib/visa";
import { visaTypeLabel } from "@/lib/seo-suggestions";
import {
  getActiveFlightRouteBySlug,
  getActiveFlightRoutes,
  getRelatedFlightRoutes,
  type FlightRouteView,
} from "@/lib/flight-routes";
import {
  buildMetadata,
  createBreadcrumbSchema,
  createFAQSchema,
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";
import { getFlightRoutePath } from "@/lib/validations/flight-route";

type FlightRoutePageProps = {
  params: Promise<{ route: string }>;
};

const TRUST_NOTES = [
  "No payment needed to ask for a fare",
  "Fares compared across airlines by our team",
  "Help with changes, baggage and Umrah groups",
];

function routeName(route: FlightRouteView) {
  return `${route.originCity} to ${route.destinationCity}`;
}

// Render each route on its first visit, then serve it from the ISR cache;
// admin saves revalidate the site.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: FlightRoutePageProps): Promise<Metadata> {
  const { route: slug } = await params;
  const route = await getActiveFlightRouteBySlug(slug);

  if (!route) {
    throwIfDatabaseUnavailable();
    return buildMetadata({
      title: "Flight route not found",
      description: "The requested flight route could not be found.",
      path: `/flights/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: route.seoTitle,
    description: route.seoDescription,
    path: getFlightRoutePath(route.slug),
    keywords: [
      `${routeName(route)} flights`,
      `${route.originCity} to ${route.destinationCity} ticket price`,
      `${route.originIata} to ${route.destinationIata}`,
      ...route.airlines.map((airline) => airline.name),
    ],
  });
}

export default async function FlightRoutePage({ params }: FlightRoutePageProps) {
  const { route: slug } = await params;
  const [route, allRoutes, contact, visas, brand] = await Promise.all([
    getActiveFlightRouteBySlug(slug),
    getActiveFlightRoutes(),
    getStoredSupportContactSettings(),
    getStoredVisaCountries(),
    getStoredBrandSettings(),
  ]);

  if (!route) {
    throwIfDatabaseUnavailable();
    notFound();
  }

  const name = routeName(route);
  const pagePath = getFlightRoutePath(route.slug);
  const related = getRelatedFlightRoutes(route, allRoutes);
  const phone = getPrimaryPhone(contact);
  const whatsapp = getWhatsappLink(contact);
  const whatsappHref = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(`Hi, I need a fare for ${name} (${route.originIata}-${route.destinationIata}).`)}`
    : null;
  const cta = whatsappHref
    ? { href: whatsappHref, label: "Get fare" }
    : phone
      ? { href: `tel:${phone}`, label: "Call us" }
      : { href: "#search", label: "Search" };
  const destinationVisas = visas.filter(
    (visa) =>
      visa.isActive &&
      visa.country.trim().toLowerCase() === route.destinationCountry.trim().toLowerCase(),
  );
  const nonStop = route.airlines.filter((airline) => /non-?stop|direct/i.test(airline.service));

  return (
    <DetailPage>
      <StructuredData
        data={[
          {
            ...createWebPageSchema({
              title: route.seoTitle,
              description: route.seoDescription,
              path: pagePath,
            }),
            about: [
              {
                "@type": "Airport",
                name: route.originAirport,
                iataCode: route.originIata,
                address: { "@type": "PostalAddress", addressLocality: route.originCity },
              },
              {
                "@type": "Airport",
                name: route.destinationAirport,
                iataCode: route.destinationIata,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: route.destinationCity,
                  addressCountry: route.destinationCountry,
                },
              },
            ],
          },
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Flights", path: "/flights" },
            { name: `${name} Flights`, path: pagePath },
          ]),
          ...(route.faqs.length > 0 ? [createFAQSchema(route.faqs)] : []),
          ...(related.length > 0
            ? [
                createItemListSchema(
                  related.map((item) => ({
                    name: `${routeName(item)} flights`,
                    path: getFlightRoutePath(item.slug),
                  })),
                  "Related flight routes",
                ),
              ]
            : []),
        ]}
      />

      <div className="section-shell">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Flights", href: "/flights" },
            { name: `${name} Flights` },
          ]}
        />

        <DetailTitle
          title={`${name} Flights`}
          subtitle={`Cheap air tickets from ${route.originCity} (${route.originIata}) to ${route.destinationCity} (${route.destinationIata}). Search live fares or ask our team for the best price.`}
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
              <BrandIcon src={brand.assets.flights} fallback={Plane} size={16} />
              {route.originIata} → {route.destinationIata}
            </span>
          }
          meta={
            <>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-muted" />
                {route.flightTime}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Plane className="size-4 text-muted" />
                {route.airlines.length} {route.airlines.length === 1 ? "airline" : "airlines"}
              </span>
            </>
          }
        />
      </div>

      <div id="search" className="mb-8 scroll-mt-24">
        <FlightSearchEngine
          variant="embedded"
          initialValues={{
            origin: `${route.originCity} (${route.originIata})`,
            originIata: route.originIata,
            destination: `${route.destinationCity} (${route.destinationIata})`,
            destinationIata: route.destinationIata,
          }}
        />
      </div>

      <div className="section-shell">
        <DetailLayout
          aside={
            <div className="rounded-card border border-line bg-white p-6 shadow-card">
              <p className="text-sm text-muted">{name}</p>
              {route.fareFrom ? (
                <>
                  <p className="text-sm text-muted">Fares from</p>
                  <p className="text-[28px] font-bold leading-tight tabular-nums text-foreground">
                    {route.fareFrom}
                  </p>
                  <p className="text-sm text-muted">one way, per adult, subject to availability</p>
                </>
              ) : (
                <p className="mt-1 text-lg font-semibold text-foreground">
                  Ask us for today&apos;s best fare
                </p>
              )}
              <div className="mt-5 grid gap-2">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-white transition hover:bg-brand-strong"
                  >
                    <BrandIcon src={brand.assets.footerWhatsapp} fallback={MessageCircle} size={20} />
                    Get fare on WhatsApp
                  </a>
                ) : null}
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong text-base font-semibold text-foreground transition hover:border-brand hover:text-brand"
                  >
                    <BrandIcon src={brand.assets.hotline} fallback={Phone} size={20} />
                    Call {phone}
                  </a>
                ) : null}
              </div>
              <div className="mt-5">
                <TrustNotes notes={TRUST_NOTES} />
              </div>
            </div>
          }
        >
          <DetailSection title={`Flights from ${name}`}>
            <div className="space-y-3 text-sm leading-relaxed text-foreground">
              {route.intro.split(/\n\s*\n/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </DetailSection>

          <DetailSection title={`${name} route at a glance`}>
            <FactGrid
              facts={[
                {
                  icon: PlaneTakeoff,
                  iconSrc: brand.assets.planeTakeoff,
                  label: "Departure airport",
                  value: `${route.originAirport} (${route.originIata})`,
                },
                {
                  icon: PlaneLanding,
                  iconSrc: brand.assets.planeLanding,
                  label: "Arrival airport",
                  value: `${route.destinationAirport} (${route.destinationIata})`,
                },
                { icon: Clock, label: "Flight time", value: route.flightTime },
                { icon: RouteIcon, label: "Distance", value: route.distance },
                {
                  icon: Plane,
                  label: "Non-stop airlines",
                  value:
                    nonStop.length > 0
                      ? nonStop.map((airline) => airline.name).join(", ")
                      : "Connecting flights only",
                },
              ]}
            />
          </DetailSection>

          <DetailSection title={`Airlines flying ${name}`}>
            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-subtle text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Airline</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Code</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Service</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {route.airlines.map((airline) => (
                    <tr key={`${airline.code}-${airline.service}`}>
                      <td className="px-4 py-3 font-medium text-foreground">{airline.name}</td>
                      <td className="px-4 py-3 tabular-nums text-muted">{airline.code}</td>
                      <td className="px-4 py-3 text-foreground">{airline.service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              Schedules and frequencies change by season. Our team confirms the
              current options and baggage allowance when you ask for a fare.
            </p>
          </DetailSection>

          {route.travelTips.length > 0 ? (
            <DetailSection title={`Tips for flying ${name}`}>
              <CheckList items={route.travelTips} />
            </DetailSection>
          ) : null}

          {route.documents.length > 0 ? (
            <DetailSection title={`Documents for ${route.destinationCity} flights from Pakistan`}>
              <CheckList items={route.documents} />
              {destinationVisas.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {destinationVisas.map((visa) => (
                    <Link
                      key={`${visa.country}-${visa.visaType}`}
                      href={getVisaPath(visa.country, visa.visaType)}
                      className="inline-flex items-center gap-2 rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand-soft"
                    >
                      <BrandIcon src={brand.assets.visa} fallback={FileCheck2} size={20} />
                      Apply for a {visa.country} {visaTypeLabel(visa.visaType)} with us
                      <ArrowRight className="size-4" />
                    </Link>
                  ))}
                </div>
              ) : null}
            </DetailSection>
          ) : null}

          {route.faqs.length > 0 ? (
            <DetailSection title={`${name} flights: FAQs`}>
              <div className="divide-y divide-line rounded-card border border-line">
                {route.faqs.map((faq) => (
                  <details key={faq.question} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                      <h3 className="inline">{faq.question}</h3>
                    </summary>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </DetailSection>
          ) : null}

          {related.length > 0 ? (
            <DetailSection title="Popular flight routes">
              <ul className="grid gap-2 sm:grid-cols-2">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={getFlightRoutePath(item.slug)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand"
                    >
                      <BrandIcon src={brand.assets.flights} fallback={Plane} size={24} />
                      <span className="flex-1">
                        {routeName(item)} flights
                        <span className="ml-2 text-xs text-muted">
                          {item.originIata}–{item.destinationIata}
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}
        </DetailLayout>
      </div>

      <MobileBookingBar
        amount={route.fareFrom ?? `${route.originIata} → ${route.destinationIata}`}
        note={route.fareFrom ? "one way, per adult" : name}
        ctaLabel={cta.label}
        ctaHref={cta.href}
      />
    </DetailPage>
  );
}
