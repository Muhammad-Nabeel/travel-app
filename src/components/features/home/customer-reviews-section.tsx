"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import type { CustomerReviewRow } from "@/app/api/reviews/route";

type PublicReview = Pick<
  CustomerReviewRow,
  | "id"
  | "customerName"
  | "location"
  | "rating"
  | "title"
  | "body"
  | "tripType"
  | "isVerified"
>;

function RatingStars({ rating }: { rating: number }) {
  return (
    <div
      className="inline-flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < rating;
        return (
          <Star
            key={index}
            className={`h-4 w-4 ${active ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        );
      })}
    </div>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "NA";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function CustomerReviewsSection() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        const json = (await res.json()) as PublicReview[];
        if (!cancelled) {
          setReviews(Array.isArray(json) ? json : []);
        }
      } catch {
        if (!cancelled) {
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const sliderReviews = useMemo(() => reviews, [reviews]);

  return (
    <section className="section-shell py-6" aria-label="Customer reviews">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Customer Voices
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">
              Verified traveler reviews
            </h2>
          </div>
        </div>

        {loading ? (
          <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Loading customer reviews...
          </p>
        ) : sliderReviews.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
            No published reviews yet.
          </p>
        ) : (
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
            {sliderReviews.map((review) => (
              <article
                key={review.id}
                className="w-[17.5rem] shrink-0 snap-start rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:w-[18.5rem]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700">
                      {initialsFromName(review.customerName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {review.customerName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {review.location || "Traveler"}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>

                <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold text-slate-800">
                  {review.title}
                </h3>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {review.tripType && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      {review.tripType}
                    </span>
                  )}
                  {review.isVerified && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Verified
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
