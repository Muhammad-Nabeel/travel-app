import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  Coins,
  Globe2,
  Languages,
  MapPin,
  Plane,
} from "lucide-react";
import { cache } from "react";

import { getActivityHref } from "@/lib/activity-href";
import { prisma } from "@/lib/db";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { StructuredData } from "@/components/shared/structured-data";
import { absoluteUrl, buildMetadata, createBreadcrumbSchema } from "@/lib/seo";

type DestinationPageProps = {
  params: Promise<{ slug: string }>;
};

const GRADIENTS: Record<string, string> = {
  blue: "linear-gradient(130deg, #274c77 0%, #6096ba 45%, #a3cef1 100%)",
  dark: "linear-gradient(130deg, #2b2d42 0%, #8d99ae 45%, #edf2f4 100%)",
  ocean: "linear-gradient(130deg, #003049 0%, #669bbc 45%, #eae2b7 100%)",
  purple: "linear-gradient(130deg, #4a4e69 0%, #9a8c98 45%, #c9ada7 100%)",
  teal: "linear-gradient(130deg, #005f73 0%, #0a9396 45%, #94d2bd 100%)",
  sunset: "linear-gradient(130deg, #9d0208 0%, #dc2f02 45%, #f48c06 100%)",
  navy: "linear-gradient(130deg, #14213d 0%, #3a506b 45%, #5bc0be 100%)",
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

const getDestinationPageData = cache(async (slug: string) => {
  const destination = await prisma.destination.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isActive: true,
    },
  });

  if (!destination) {
    return null;
  }

  let activities: Array<{
    id: string;
    slug: string | null;
    title: string;
    description: string | null;
    imageUrl: string;
    cost: string;
    reviews: number;
    reviewCount: number;
  }> = [];

  try {
    activities = await prisma.activity.findMany({
      where: { destinationId: destination.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        imageUrl: true,
        cost: true,
        reviews: true,
        reviewCount: true,
      },
    });
  } catch {
    activities = [];
  }

  return { destination, activities };
});

// Render each page on its first visit, then serve it from the ISR cache
// (metadata lands in <head>; admin saves revalidate the site).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDestinationPageData(slug);

  if (!data) {
    return buildMetadata({
      title: "Destination Not Found",
      description: "The requested destination could not be found.",
      path: `/destinations/${slug}`,
      noIndex: true,
    });
  }

  const { destination } = data;

  return buildMetadata({
    title: destination.seoTitle,
    description: destination.seoDescription,
    path: `/destinations/${destination.slug?.trim() ? destination.slug : destination.id}`,
    image: destination.imageUrl ?? undefined,
    keywords: [
      destination.city,
      destination.country,
      destination.scope.toLowerCase(),
      "destination guide",
    ],
  });
}

export default async function DestinationDetailsPage({
  params,
}: DestinationPageProps) {
  const { slug } = await params;

  const data = await getDestinationPageData(slug);

  if (!data) {
    notFound();
  }

  const { destination, activities } = data;

  const highlights = toStringArray(destination.highlights);
  const travelTips = toStringArray(destination.travelTips);

  const facts = [
    {
      label: "Best Time",
      value: destination.bestTimeToVisit,
      icon: CalendarClock,
    },
    {
      label: "Ideal Stay",
      value: destination.idealStay,
      icon: Clock3,
    },
    {
      label: "Currency",
      value: destination.currency,
      icon: Coins,
    },
    {
      label: "Language",
      value: destination.language,
      icon: Languages,
    },
    {
      label: "Timezone",
      value: destination.timezone,
      icon: Globe2,
    },
  ].filter((fact) => Boolean(fact.value));

  return (
    <div className="bg-slate-50 pb-16">
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: `${destination.city}, ${destination.country}`,
            description:
              destination.overview ??
              destination.tagline ??
              `Explore ${destination.city} with destination guidance, practical travel tips, and curated activities.`,
            url: absoluteUrl(
              `/destinations/${destination.slug?.trim() ? destination.slug : destination.id}`,
            ),
            image: destination.imageUrl ?? undefined,
            address: {
              "@type": "PostalAddress",
              addressLocality: destination.city,
              addressCountry: destination.country,
            },
            touristType: highlights,
          },
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            {
              name: `${destination.city}, ${destination.country}`,
              path: `/destinations/${
                destination.slug?.trim() ? destination.slug : destination.id
              }`,
            },
          ]),
        ]}
      />

      <section
        className="relative overflow-hidden"
        style={{
          background: GRADIENTS[destination.gradient] ?? GRADIENTS.blue,
        }}
      >
        {destination.imageUrl ? (
          <Image
            src={destination.imageUrl}
            alt={destination.city}
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/50" />

        <div className="section-shell relative py-14 text-white md:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mt-8 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs tracking-[0.2em] text-white/90 uppercase">
              <Plane className="h-3.5 w-3.5" />
              {destination.scope === "DOMESTIC" ? "Domestic" : "International"}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              {destination.city}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-white/90">
              <MapPin className="h-4 w-4" />
              {destination.country}
            </p>
            <p className="mt-5 text-lg text-white/95">
              {destination.tagline ??
                destination.notes ??
                "Explore this destination with tailored travel planning and competitive fares."}
            </p>
            <p className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
              Starting from {destination.fare}
            </p>
          </div>
        </div>
      </section>

      <div className="section-shell -mt-7 relative z-20 md:-mt-10">
        <FlightSearchEngine
          variant="embedded"
          initialValues={{
            destination: destination.city,
            destinationIata: destination.iataCode ?? "",
          }}
        />
      </div>

      <section className="section-shell mt-8 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            About {destination.city}
          </h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">
            {destination.overview ??
              "Destination details will appear here once your admin team adds the overview content."}
          </p>

          {travelTips.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-900">
                Travel Tips
              </h3>
              <ul className="mt-3 space-y-2">
                {travelTips.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Tags
            </h3>
            {highlights.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-800 ring-1 ring-cyan-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Add highlights in admin to show destination tags here.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Quick Facts
            </h3>
            {facts.length > 0 ? (
              <div className="mt-4 space-y-3">
                {facts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div
                      key={fact.label}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {fact.label}
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {fact.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Add destination facts from admin to display them here.
              </p>
            )}
          </div>
        </aside>
      </section>

      {activities.length > 0 ? (
        <section className="section-shell mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Activities in {destination.city}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Book top-rated experiences curated by your team.
              </p>
            </div>
            <Link
              href="/activities"
              className="text-sm font-semibold text-sky-700 hover:text-sky-800"
            >
              View all activities
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={getActivityHref(activity)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <Image
                    src={activity.imageUrl}
                    alt={activity.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                    {activity.title}
                  </h3>
                  {activity.description ? (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {activity.description}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {activity.cost}
                    </span>
                    <span className="text-xs text-slate-500">
                      {activity.reviews.toFixed(1)} ({activity.reviewCount})
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
