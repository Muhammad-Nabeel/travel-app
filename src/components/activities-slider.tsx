"use client";

import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const CATEGORY_COLORS: Record<string, string> = {
  "tourist-attraction": "bg-blue-100 text-blue-700",
  seaside: "bg-cyan-100 text-cyan-700",
  cultural: "bg-purple-100 text-purple-700",
  adventure: "bg-orange-100 text-orange-700",
  food: "bg-red-100 text-red-700",
  shopping: "bg-pink-100 text-pink-700",
};

export function ActivitiesSlider() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/activities")
      .then((r) => r.json())
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
    <section className="section-shell py-10" aria-label="Trending activities">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Trending Activities
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Top-rated experiences and attractions
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canLeft}
            aria-label="Scroll activities left"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canRight}
            aria-label="Scroll activities right"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-slate-700" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {activities.map((activity) => (
          <article
            key={activity.id}
            className="relative flex min-w-72 shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow transition hover:shadow-lg hover:-translate-y-0.5 sm:min-w-80"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-slate-200">
              <img
                src={activity.imageUrl}
                alt={activity.title}
                className="h-full w-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />

              {/* Category badge */}
              <div className="absolute right-3 top-3">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    CATEGORY_COLORS[activity.category] ||
                    CATEGORY_COLORS["tourist-attraction"]
                  }`}
                >
                  {activity.category.replace("-", " ")}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                  {activity.title}
                </h3>
                {activity.description && (
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Reviews */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(activity.reviews)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {activity.reviews.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">
                  ({activity.reviewCount.toLocaleString()} reviews)
                </span>
              </div>

              {/* Cost */}
              <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-semibold text-slate-700">
                  {activity.cost}
                </span>
                <span className="text-xs text-slate-500">per person</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
