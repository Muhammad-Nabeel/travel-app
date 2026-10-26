"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SectionHeader } from "@/components/shared/section-header";

type Activity = {
  id: string;
  destinationId: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string;
  cost: string;
  reviews: number;
  reviewCount: number;
  sortOrder: number;
  isActive: boolean;
};

function ActivitiesSkeleton() {
  return (
    <section className="section-shell py-12 md:py-16">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex w-[82%] shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-white sm:w-72"
          >
            <div className="relative aspect-4/3 animate-pulse bg-slate-200">
              <div className="absolute right-3 top-3 h-5 w-20 animate-pulse rounded-full bg-slate-300" />
            </div>
            <div className="flex flex-col gap-2 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-3 w-3 animate-pulse rounded bg-slate-200"
                  />
                ))}
                <div className="ml-1 h-3 w-8 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="mt-1 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActivitiesSlider() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch("/api/activities", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setActivities(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (loading) return <ActivitiesSkeleton />;

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (activities.length === 0) return null;

  return (
    <section className="section-shell py-12 md:py-16" aria-label="Trending activities">
      <SectionHeader
        title="Things to do"
        subtitle="Top-rated experiences and attractions"
        href="/activities"
        onPrev={() => scroll("left")}
        onNext={() => scroll("right")}
        canPrev={canLeft}
        canNext={canRight}
        scrollLabel="activities"
      />

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="-mx-1 flex snap-x gap-5 overflow-x-auto px-1 pb-3"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.id}`}
            className="group block w-[82%] shrink-0 snap-start sm:w-72"
            aria-label={`View details for ${activity.title}`}
          >
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-raised">
              <div className="relative aspect-4/3 overflow-hidden bg-subtle">
                <Image
                  src={activity.imageUrl}
                  alt={activity.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  width={512}
                  height={384}
                  unoptimized
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
      </div>
    </section>
  );
}
