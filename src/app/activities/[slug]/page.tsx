import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import { cache } from "react";

import { Breadcrumbs } from "@/components/features/detail/breadcrumbs";
import {
  BookingCard,
  DetailLayout,
  DetailPage,
  DetailSection,
  DetailTitle,
  MobileBookingBar,
  TrustNotes,
} from "@/components/features/detail/detail-kit";
import { PhotoGallery } from "@/components/features/detail/photo-gallery";
import { StructuredData } from "@/components/shared/structured-data";
import {
  prisma,
  shouldBypassDatabase,
  markDatabaseUnavailable,
} from "@/lib/db";
import {
  absoluteUrl,
  buildMetadata,
  createBreadcrumbSchema,
} from "@/lib/seo";
import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
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

    const destination = await prisma.destination.findFirst({
      where: { id: activity.destinationId, isActive: true },
      select: { id: true, slug: true, city: true, country: true },
    });

    return { activity, destination };
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
    notFound();
  }

  const { activity, destination } = data;
  const activityHref = getActivityHref(activity);

  // Old /activities/<id> links move permanently to the slug URL.
  if (activityHref !== `/activities/${slug}`) {
    permanentRedirect(activityHref);
  }
  const brand = await getStoredBrandSettings();

  return (
    <DetailPage>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: activity.title,
            description:
              activity.description ??
              `Discover ${activity.title} and book it through ${brand.name}.`,
            url: absoluteUrl(activityHref),
            image: activity.imageUrl,
            touristType: formatCategory(activity.category),
            containedInPlace: destination
              ? {
                  "@type": "Place",
                  name: `${destination.city}, ${destination.country}`,
                }
              : undefined,
            aggregateRating:
              activity.reviewCount > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: activity.reviews.toFixed(1),
                    reviewCount: activity.reviewCount,
                  }
                : undefined,
          },
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
          <DetailSection title="About this activity">
            <p className="text-base leading-7 text-foreground">
              {activity.description ??
                `Discover ${activity.title} and book it with a ${brand.name} travel adviser.`}
            </p>
          </DetailSection>

          {destination ? (
            <DetailSection title="Where it is">
              <Link
                href={getDestinationHref(destination)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-strong"
              >
                <MapPin className="size-4" />
                More things to do in {destination.city}, {destination.country}
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
