import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { cache } from "react";

import { StructuredData } from "@/components/shared/structured-data";
import {
  prisma,
  shouldBypassDatabase,
  markDatabaseUnavailable,
} from "@/lib/db";
import { absoluteUrl, buildMetadata, createBreadcrumbSchema } from "@/lib/seo";

type ActivityPageProps = {
  params: Promise<{ id: string }>;
};

type DestinationSummary = {
  id: string;
  slug: string | null;
  city: string;
  country: string;
};

const getActivityDetails = cache(async (id: string) => {
  if (shouldBypassDatabase()) {
    return null;
  }

  try {
    const activity = await prisma.activity.findFirst({
      where: { id, isActive: true },
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

function formatCategory(category: string) {
  return category.split("-").join(" ");
}

function getDestinationHref(destination: DestinationSummary) {
  return `/destinations/${destination.slug?.trim() ? destination.slug : destination.id}`;
}

export async function generateMetadata({
  params,
}: ActivityPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getActivityDetails(id);

  if (!data) {
    return buildMetadata({
      title: "Activity Not Found",
      description: "The requested activity could not be found.",
      path: `/activities/${id}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: data.activity.title,
    description:
      data.activity.description ??
      `Discover ${data.activity.title} and book it through Safar Umrah.`,
    path: `/activities/${data.activity.id}`,
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
  const { id } = await params;
  const data = await getActivityDetails(id);

  if (!data) {
    notFound();
  }

  const { activity, destination } = data;

  return (
    <main className="bg-slate-50 pb-16">
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: activity.title,
            description:
              activity.description ??
              `Discover ${activity.title} and book it through Safar Umrah.`,
            url: absoluteUrl(`/activities/${activity.id}`),
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
            { name: activity.title, path: `/activities/${activity.id}` },
          ]),
        ]}
      />

      <section className="section-shell pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl bg-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activity.imageUrl}
              alt={activity.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-800">
              {formatCategory(activity.category)}
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {activity.title}
            </h1>
            {activity.description ? (
              <p className="mt-3 text-base leading-7 text-slate-600">
                {activity.description}
              </p>
            ) : null}

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(activity.reviews)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-slate-800">
                {activity.reviews.toFixed(1)}
              </span>
              <span className="text-slate-500">
                ({activity.reviewCount.toLocaleString()} reviews)
              </span>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm uppercase tracking-wide text-slate-500">
                Starting from
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {activity.cost}
              </p>
              <p className="text-xs text-slate-500">per person</p>
            </div>

            {destination ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Destination
                </p>
                <Link
                  href={getDestinationHref(destination)}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800"
                >
                  <MapPin className="h-4 w-4" />
                  {destination.city}, {destination.country}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
