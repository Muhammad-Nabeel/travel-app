import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ArrowRight, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { ProductTabs } from "@/components/features/home/product-tabs";
import { HeroBackdrop } from "@/components/shared/hero-backdrop";
import { StructuredData } from "@/components/shared/structured-data";
import {
  prisma,
  shouldBypassDatabase,
  markDatabaseUnavailable,
} from "@/lib/db";
import { createItemListSchema, createWebPageSchema } from "@/lib/seo";
import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import { getPageBanner } from "@/lib/admin-settings/page-banner-settings";
import { getActivityHref } from "@/lib/activity-href";
import {
  ActivitySearchInput,
  type ActivitySuggestion,
} from "@/components/features/activities/activity-search-input";

// Mirrors the field styling of the other services' search cards.
const fieldClass =
  "flex min-h-14 min-w-0 cursor-text flex-col justify-center gap-0.5 rounded-xl border border-line bg-white px-3.5 py-2 transition focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/10";
const fieldLabelClass = "text-xs font-medium text-muted";
const fieldControlClass =
  "w-full min-w-0 bg-transparent text-[0.95rem] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted";

type DestinationSummary = {
  id: string;
  slug: string | null;
  city: string;
  country: string;
};

type ActivitySummary = {
  id: string;
  slug: string | null;
  destinationId: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string;
  cost: string;
  reviews: number;
  reviewCount: number;
};

type ActivitiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatCategory(category: string) {
  return category.split("-").join(" ");
}

function toSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export async function generateMetadata({
  searchParams,
}: ActivitiesPageProps): Promise<Metadata> {
  const resolvedParams = (await searchParams) ?? {};
  const category = toSingleValue(resolvedParams.category);
  const destinationId = toSingleValue(resolvedParams.destinationId);
  const search = toSingleValue(resolvedParams.search);
  const minRating = toSingleValue(resolvedParams.minRating);
  const sort = toSingleValue(resolvedParams.sort);
  const hasFilters = Boolean(
    category || destinationId || search || minRating || sort,
  );

  // Filtered views are thin variations of /activities; keep them out of the index.
  return buildStaticPageMetadata("activities", { noIndex: hasFilters });
}

async function getActivitiesWithDestinations(filters: {
  category?: string;
  destinationId?: string;
  search?: string;
  minRating?: number;
  sort?: string;
}): Promise<{
  activities: ActivitySummary[];
  destinations: DestinationSummary[];
  categories: string[];
  suggestions: ActivitySuggestion[];
}> {
  if (shouldBypassDatabase()) {
    return {
      activities: [],
      destinations: [],
      categories: [],
      suggestions: [],
    };
  }

  try {
    const where: {
      isActive: boolean;
      category?: string;
      destinationId?: string;
      OR?: Prisma.ActivityWhereInput[];
      reviews?: { gte: number };
    } = { isActive: true };

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.destinationId) {
      where.destinationId = filters.destinationId;
    }
    if (filters.search) {
      // Matches what the autocomplete suggests: title, city, country or category.
      const contains = {
        contains: filters.search,
        mode: "insensitive",
      } as const;
      where.OR = [
        { title: contains },
        {
          category: {
            contains: filters.search.trim().split(" ").join("-"),
            mode: "insensitive",
          },
        },
        { destination: { city: contains } },
        { destination: { country: contains } },
      ];
    }
    if (typeof filters.minRating === "number") {
      where.reviews = { gte: filters.minRating };
    }

    const orderBy = (() => {
      switch (filters.sort) {
        case "rating-desc":
          return { reviews: "desc" } as const;
        case "reviews-desc":
          return { reviewCount: "desc" } as const;
        case "title-asc":
          return { title: "asc" } as const;
        default:
          return { sortOrder: "asc" } as const;
      }
    })();

    const activities = (await prisma.activity.findMany({
      where,
      orderBy,
    })) satisfies ActivitySummary[];

    const destinationIds = Array.from(
      new Set(activities.map((activity) => activity.destinationId)),
    );

    const destinations = destinationIds.length
      ? await prisma.destination.findMany({
          where: { id: { in: destinationIds }, isActive: true },
          select: { id: true, slug: true, city: true, country: true },
        })
      : ([] satisfies DestinationSummary[]);

    // Unfiltered, so the search autocomplete always offers every activity.
    const allActivities = await prisma.activity.findMany({
      where: { isActive: true, destination: { isActive: true } },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        destination: { select: { city: true, country: true } },
      },
    });

    return {
      activities,
      destinations,
      categories: Array.from(
        new Set(allActivities.map((item) => item.category)),
      ).sort(),
      suggestions: allActivities.map(({ destination, ...item }) => ({
        ...item,
        location: `${destination.city}, ${destination.country}`,
      })),
    };
  } catch (error) {
    markDatabaseUnavailable(error);
    return {
      activities: [],
      destinations: [],
      categories: [],
      suggestions: [],
    };
  }
}

export default async function ActivitiesPage({
  searchParams,
}: ActivitiesPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const [brand, heroImage] = await Promise.all([
    getStoredBrandSettings(),
    getPageBanner("activities"),
  ]);
  const category = toSingleValue(resolvedParams.category);
  const destinationId = toSingleValue(resolvedParams.destinationId);
  const search = toSingleValue(resolvedParams.search);
  const minRatingRaw = toSingleValue(resolvedParams.minRating);
  const sort = toSingleValue(resolvedParams.sort);
  const minRating = Number.isFinite(Number(minRatingRaw))
    ? Number(minRatingRaw)
    : undefined;

  const { activities, destinations, categories, suggestions } =
    await getActivitiesWithDestinations({
      category: category || undefined,
      destinationId: destinationId || undefined,
      search: search || undefined,
      minRating,
      sort: sort || undefined,
    });
  const destinationMap = new Map(destinations.map((d) => [d.id, d]));
  const hasFilters = Boolean(
    category || destinationId || search || minRatingRaw || sort,
  );

  return (
    <div className="min-h-screen pb-12">
      <StructuredData
        data={[
          createWebPageSchema({
            title: hasFilters ? "Filtered Activities" : "Travel Activities",
            description: hasFilters
              ? `Browse filtered travel activities and curated experiences from ${brand.name}.`
              : "Browse curated travel experiences, tours, and activities for your next trip.",
            path: "/activities",
            type: "CollectionPage",
          }),
          createItemListSchema(
            activities.map((activity) => ({
              name: activity.title,
              path: getActivityHref(activity),
            })),
            "Travel activities",
          ),
        ]}
      />

      <section className="relative z-40" aria-label="Things to do">
        <HeroBackdrop src={heroImage} />
        <div className="section-shell relative z-10 pb-10 pt-14 md:pb-14 md:pt-20">
          <div className="mx-auto mb-8 max-w-4xl text-center text-white md:mb-10">
            <h1 className="display-font text-balance text-4xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl">
              Activities
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)] sm:text-lg">
              Browse experiences curated by your team and book what fits your
              trip.
            </p>
          </div>

          <form className="w-full rounded-card border border-line bg-white px-[18px] pb-[18px] pt-4 shadow-raised">
            <ProductTabs active="activities" />

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]">
              <label className={`${fieldClass} relative`}>
                <span className={fieldLabelClass}>Search</span>
                <span className="flex items-center gap-2">
                  <Search className="size-4 shrink-0 text-muted" />
                  <ActivitySearchInput
                    name="search"
                    defaultValue={search}
                    placeholder="Try Desert Safari, Dubai, adventure…"
                    className={fieldControlClass}
                    suggestions={suggestions}
                  />
                </span>
              </label>

              <label className={fieldClass}>
                <span className={fieldLabelClass}>Category</span>
                <select
                  name="category"
                  defaultValue={category}
                  className={fieldControlClass}
                >
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {formatCategory(item)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldClass}>
                <span className={fieldLabelClass}>Destination</span>
                <select
                  name="destinationId"
                  defaultValue={destinationId}
                  className={fieldControlClass}
                >
                  <option value="">All destinations</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.city}, {dest.country}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldClass}>
                <span className={fieldLabelClass}>Min rating</span>
                <select
                  name="minRating"
                  defaultValue={minRatingRaw}
                  className={fieldControlClass}
                >
                  <option value="">Any</option>
                  <option value="4">4.0+</option>
                  <option value="4.5">4.5+</option>
                  <option value="4.8">4.8+</option>
                </select>
              </label>

              <label className={fieldClass}>
                <span className={fieldLabelClass}>Sort</span>
                <select
                  name="sort"
                  defaultValue={sort}
                  className={fieldControlClass}
                >
                  <option value="">Sort order</option>
                  <option value="rating-desc">Rating (high to low)</option>
                  <option value="reviews-desc">Reviews (most)</option>
                  <option value="title-asc">Title (A-Z)</option>
                </select>
              </label>

              <button
                type="submit"
                className="flex min-h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand px-7 text-base font-semibold text-white transition hover:bg-brand-strong sm:col-span-2 lg:col-span-1"
              >
                <Search className="size-[18px]" />
                Find activities
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="section-shell pt-4">
        {activities.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No activities available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => {
              const destination = destinationMap.get(activity.destinationId);
              return (
                <Link
                  key={activity.id}
                  href={getActivityHref(activity)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <Image
                      src={activity.imageUrl}
                      alt={activity.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-800">
                      {formatCategory(activity.category)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h3 className="text-lg font-bold leading-snug text-slate-900 line-clamp-2">
                        {activity.title}
                      </h3>
                      {activity.description ? (
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {activity.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <div className="flex items-center gap-0.5">
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
                      <span className="text-xs text-slate-500">
                        ({activity.reviewCount.toLocaleString()})
                      </span>
                    </div>

                    {destination ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>
                          {destination.city}, {destination.country}
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-sm font-semibold text-slate-700">
                        {activity.cost}
                      </span>
                      <ArrowRight className="h-4 w-4 text-sky-600 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
