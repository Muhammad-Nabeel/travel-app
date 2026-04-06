import Link from "next/link";
import { MapPin, Star, ArrowRight } from "lucide-react";

import {
  prisma,
  shouldBypassDatabase,
  markDatabaseUnavailable,
} from "@/lib/db";

type DestinationSummary = {
  id: string;
  slug: string | null;
  city: string;
  country: string;
};

type ActivitySummary = {
  id: string;
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

function getDestinationHref(destination: DestinationSummary) {
  return `/destinations/${destination.slug?.trim() ? destination.slug : destination.id}`;
}

function toSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function getActivitiesWithDestinations(filters: {
  category?: string;
  destinationId?: string;
  search?: string;
  minRating?: number;
  sort?: string;
}) {
  if (shouldBypassDatabase()) {
    return { activities: [], destinations: [], categories: [] };
  }

  try {
    const where: {
      isActive: boolean;
      category?: string;
      destinationId?: string;
      title?: { contains: string; mode: "insensitive" };
      reviews?: { gte: number };
    } = { isActive: true };

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.destinationId) {
      where.destinationId = filters.destinationId;
    }
    if (filters.search) {
      where.title = { contains: filters.search, mode: "insensitive" };
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

    const activities = await prisma.activity.findMany({
      where,
      orderBy,
    });

    const destinationIds = Array.from(
      new Set(activities.map((activity) => activity.destinationId)),
    );

    const destinations = destinationIds.length
      ? await prisma.destination.findMany({
          where: { id: { in: destinationIds }, isActive: true },
          select: { id: true, slug: true, city: true, country: true },
        })
      : [];

    const categories = await prisma.activity.findMany({
      where: { isActive: true },
      select: { category: true },
    });

    return {
      activities,
      destinations,
      categories: Array.from(
        new Set(categories.map((item) => item.category)),
      ).sort(),
    };
  } catch (error) {
    markDatabaseUnavailable(error);
    return { activities: [], destinations: [], categories: [] };
  }
}

export default async function ActivitiesPage({
  searchParams,
}: ActivitiesPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const category = toSingleValue(resolvedParams.category);
  const destinationId = toSingleValue(resolvedParams.destinationId);
  const search = toSingleValue(resolvedParams.search);
  const minRatingRaw = toSingleValue(resolvedParams.minRating);
  const sort = toSingleValue(resolvedParams.sort);
  const minRating = Number.isFinite(Number(minRatingRaw))
    ? Number(minRatingRaw)
    : undefined;

  const { activities, destinations, categories } =
    await getActivitiesWithDestinations({
      category: category || undefined,
      destinationId: destinationId || undefined,
      search: search || undefined,
      minRating,
      sort: sort || undefined,
    });
  const destinationMap = new Map(destinations.map((d) => [d.id, d]));

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <section className="section-shell">
        <div className="mb-10 space-y-3">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Activities
          </h1>
          <p className="text-lg text-slate-600">
            Browse experiences curated by your team and book what fits your
            trip.
          </p>
        </div>

        <form className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by title"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 focus:border-slate-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
            </label>
            <select
              name="category"
              defaultValue={category}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-300"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {formatCategory(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Destination
            </label>
            <select
              name="destinationId"
              defaultValue={destinationId}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-300"
            >
              <option value="">All destinations</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.city}, {dest.country}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Min rating
            </label>
            <select
              name="minRating"
              defaultValue={minRatingRaw}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-300"
            >
              <option value="">Any</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.8">4.8+</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort
            </label>
            <select
              name="sort"
              defaultValue={sort}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-300"
            >
              <option value="">Sort order</option>
              <option value="rating-desc">Rating (high to low)</option>
              <option value="reviews-desc">Reviews (most)</option>
              <option value="title-asc">Title (A-Z)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </form>

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
                  href={`/activities/${activity.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
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
    </main>
  );
}
