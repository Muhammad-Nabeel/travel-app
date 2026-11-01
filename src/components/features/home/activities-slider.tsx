import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { CardCarousel } from "@/components/shared/card-carousel";
import { getActivityHref } from "@/lib/activity-href";
import { getActiveActivities } from "@/lib/home-sections";

export async function ActivitiesSlider() {
  const activities = await getActiveActivities();
  if (activities.length === 0) return null;

  return (
    <CardCarousel
      ariaLabel="Trending activities"
      title="Things to do"
      subtitle="Top-rated experiences and attractions"
      href="/activities"
      scrollLabel="activities"
    >
      {activities.map((activity) => (
        <Link
          key={activity.id}
          href={getActivityHref(activity)}
          className="group block w-[82%] shrink-0 snap-start sm:w-72"
          aria-label={`View details for ${activity.title}`}
        >
          <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-raised">
            <div className="relative aspect-4/3 overflow-hidden bg-subtle">
              <Image
                src={activity.imageUrl}
                alt={activity.title}
                fill
                sizes="(min-width: 640px) 288px, 82vw"
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-foreground shadow-card">
                {activity.category.replace("-", " ")}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
                {activity.title}
              </h3>
              {activity.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {activity.description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-xs font-bold text-white">
                  {activity.reviews.toFixed(1)}
                  <Star className="size-3 fill-white" />
                </span>
                <span className="text-xs text-muted">
                  {activity.reviewCount.toLocaleString()} reviews
                </span>
              </div>

              <div className="mt-auto pt-4 text-right">
                <p className="text-lg font-bold text-foreground">{activity.cost}</p>
                <p className="text-xs text-muted">per person</p>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </CardCarousel>
  );
}
