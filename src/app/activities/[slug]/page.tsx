import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CalendarDays, Clock, MapPin, Star, Timer } from "lucide-react";
import { cache } from "react";

import { Breadcrumbs } from "@/components/features/detail/breadcrumbs";
import {
  BookingCard,
  CheckList,
  DetailLayout,
  DetailPage,
  DetailSection,
  DetailTitle,
  FactGrid,
  InclusionLists,
  MobileBookingBar,
  TrustNotes,
} from "@/components/features/detail/detail-kit";
import { PhotoGallery } from "@/components/features/detail/photo-gallery";
import { StructuredData } from "@/components/shared/structured-data";
import {
  markDatabaseUnavailable,
  prisma,
  shouldBypassDatabase,
  throwIfDatabaseUnavailable,
} from "@/lib/db";
import {
  absoluteUrl,
  buildMetadata,
  createBreadcrumbSchema,
  createFAQSchema,
} from "@/lib/seo";
import { toActivityFaqs, toStringList } from "@/lib/validations/activity";
import { getActivityHref } from "@/lib/activity-href";

type ActivityPageProps = {
  params: Promise<{ slug: string }>;
};

type DestinationSummary = {
  id: string;
  slug: string | null;
  city: string;
  country: string;
};

// Accepts the slug or, for links shared before slugs existed, the id.
const getActivityDetails = cache(async (slugOrId: string) => {
  if (shouldBypassDatabase()) {
    return null;
  }

  try {
    const activity = await prisma.activity.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true },
    });

    if (!activity) return null;

    const [destination, related] = await Promise.all([
      prisma.destination.findFirst({
        where: { id: activity.destinationId, isActive: true },
        select: { id: true, slug: true, city: true, country: true },
      }),
      prisma.activity.findMany({
        where: {
          destinationId: activity.destinationId,
          isActive: true,
          id: { not: activity.id },
        },
        orderBy: { sortOrder: "asc" },
        take: 4,
        select: { id: true, slug: true, title: true, cost: true, duration: true },
      }),
    ]);

    return { activity, destination, related };
  } catch (error) {
    markDatabaseUnavailable(error);
    return null;
  }
});

const BOOK_HREF = "/arrange-a-call";

function formatCategory(category: string) {
  return category.split("-").join(" ");
}

function getDestinationHref(destination: DestinationSummary) {
  return `/destinations/${destination.slug?.trim() ? destination.slug : destination.id}`;
}

// Render each page on its first visit, then serve it from the ISR cache
// (metadata lands in <head>; admin saves revalidate the site).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: ActivityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getActivityDetails(slug);

  if (!data) {
    throwIfDatabaseUnavailable();
    return buildMetadata({
      title: "Activity Not Found",
      description: "The requested activity could not be found.",
      path: `/activities/${slug}`,
      noIndex: true,
    });
  }

  const { activity } = data;

  return buildMetadata({
    title: activity.seoTitle,
    description: activity.seoDescription,
    path: getActivityHref(data.activity),
    image: data.activity.imageUrl,
    keywords: [
      data.activity.category,
      data.destination?.city ?? "activity",
      "travel activities",
    ],
  });
}

export default async function ActivityDetailsPage({
  params,
}: ActivityPageProps) {
  const { slug } = await params;
  const data = await getActivityDetails(slug);

  if (!data) {
    throwIfDatabaseUnavailable();
    notFound();
  }

  const { activity, destination, related } = data;
  const activityHref = getActivityHref(activity);
  const highlights = toStringList(activity.highlights);
  const included = toStringList(activity.included);
  const excluded = toStringList(activity.excluded);
  const itinerary = toStringList(activity.itinerary);
  const importantInfo = toStringList(activity.importantInfo);
  const faqs = toActivityFaqs(activity.faqs);
  const facts = [
    { icon: Timer, label: "Duration", value: activity.duration },
    { icon: Clock, label: "Opening hours", value: activity.openingHours },
    { icon: MapPin, label: "Location", value: activity.location },
    { icon: CalendarDays, label: "Best time to visit", value: activity.bestTimeToVisit },
  ].filter((fact): fact is typeof fact & { value: string } => Boolean(fact.value));

  // Old /activities/<id> links move permanently to the slug URL.
  if (activityHref !== `/activities/${slug}`) {
    permanentRedirect(activityHref);
  }

  return (
    <DetailPage>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: activity.title,
            description: activity.description,
            url: absoluteUrl(activityHref),
            image: activity.imageUrl,
            touristType: formatCategory(activity.category),
            containedInPlace: destination
              ? {
                  "@type": "TouristDestination",
                  name: `${destination.city}, ${destination.country}`,
                  url: absoluteUrl(getDestinationHref(destination)),
                }
              : undefined,
            ...(activity.location
              ? { address: activity.location }
              : {}),
            ...(activity.cost.trim().toLowerCase() === "free"
              ? { isAccessibleForFree: true }
              : {}),
            // No aggregateRating: the rating/review counts are not backed by
            // reviews collected on this site, and marking up unverified
            // ratings violates Google's review-snippet policy.
          },
          ...(faqs.length > 0 ? [createFAQSchema(faqs)] : []),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Activities", path: "/activities" },
            { name: activity.title, path: activityHref },
          ]),
        ]}
      />

      <div className="section-shell">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Activities", href: "/activities" },
            { name: activity.title },
          ]}
        />

        <DetailTitle
          title={activity.title}
          badge={
            <span className="inline-flex rounded-full bg-subtle px-2.5 py-1 text-xs font-semibold capitalize text-foreground">
              {formatCategory(activity.category)}
            </span>
          }
          meta={
            <>
              {activity.reviewCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-xs font-bold text-white">
                    {activity.reviews.toFixed(1)}
                    <Star className="size-3 fill-white" />
                  </span>
                  <span className="text-muted">
                    {activity.reviewCount.toLocaleString()} reviews
                  </span>
                </span>
              ) : null}
              {destination ? (
                <Link
                  href={getDestinationHref(destination)}
                  className="inline-flex items-center gap-1.5 hover:text-brand hover:underline"
                >
                  <MapPin className="size-4 text-muted" />
                  {destination.city}, {destination.country}
                </Link>
              ) : null}
            </>
          }
        />

        <PhotoGallery photos={[{ src: activity.imageUrl, alt: activity.title }]} />

        <DetailLayout
          aside={
            <BookingCard
              price={{ label: "from", amount: activity.cost, note: "per person" }}
              ctaLabel="Arrange a call"
              ctaHref={BOOK_HREF}
              footer={
                <TrustNotes
                  notes={[
                    "No payment needed to ask",
                    "An adviser books tickets and transfers for you",
                  ]}
                />
              }
            />
          }
        >
          {facts.length > 0 ? (
            <DetailSection title="Key details">
              <FactGrid facts={facts} />
            </DetailSection>
          ) : null}

          <DetailSection title="About this activity">
            <p className="whitespace-pre-line text-base leading-7 text-foreground">
              {activity.description}
            </p>
          </DetailSection>

          {highlights.length > 0 ? (
            <DetailSection title="Highlights">
              <CheckList items={highlights} />
            </DetailSection>
          ) : null}

          {included.length > 0 || excluded.length > 0 ? (
            <DetailSection title="What's included">
              <InclusionLists included={included} excluded={excluded} />
            </DetailSection>
          ) : null}

          {itinerary.length > 0 ? (
            <DetailSection title="What to expect">
              <ol className="space-y-4">
                {itinerary.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-bold text-foreground">
                      {index + 1}
                    </span>
                    <p className="pt-0.5 text-sm leading-6 text-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </DetailSection>
          ) : null}

          {importantInfo.length > 0 ? (
            <DetailSection title="Know before you go">
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-foreground marker:text-muted">
                {importantInfo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          {activity.cancellationPolicy ? (
            <DetailSection title="Cancellation policy">
              <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                {activity.cancellationPolicy}
              </p>
            </DetailSection>
          ) : null}

          {faqs.length > 0 ? (
            <DetailSection title="Frequently asked questions">
              <div className="space-y-2">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-xl border border-line bg-subtle px-4 py-3"
                  >
                    <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
                      <h3 className="inline text-base">{faq.question}</h3>
                    </summary>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </DetailSection>
          ) : null}

          {destination ? (
            <DetailSection
              title={`More things to do in ${destination.city}`}
            >
              {related.length > 0 ? (
                <ul className="mb-4 grid gap-3 sm:grid-cols-2">
                  {related.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={getActivityHref(item)}
                        className="flex h-full flex-col rounded-xl border border-line px-4 py-3 transition hover:border-brand"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-1 text-xs text-muted">
                          {item.cost}
                          {item.duration ? ` · ${item.duration}` : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                href={getDestinationHref(destination)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-strong"
              >
                <MapPin className="size-4" />
                {destination.city}, {destination.country} travel guide
              </Link>
            </DetailSection>
          ) : null}
        </DetailLayout>
      </div>

      <MobileBookingBar
        amount={activity.cost}
        note="per person"
        ctaLabel="Arrange a call"
        ctaHref={BOOK_HREF}
      />
    </DetailPage>
  );
}
