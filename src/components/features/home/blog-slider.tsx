"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Tag } from "lucide-react";
import Link from "next/link";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  travel: "Travel",
  umrah: "Umrah",
  flights: "Flights",
  hotels: "Hotels",
  destinations: "Destinations",
  tips: "Tips",
  news: "News",
};

const CATEGORY_COLORS: Record<string, string> = {
  travel: "bg-teal-100 text-teal-700",
  umrah: "bg-emerald-100 text-emerald-700",
  flights: "bg-sky-100 text-sky-700",
  hotels: "bg-violet-100 text-violet-700",
  destinations: "bg-amber-100 text-amber-700",
  tips: "bg-orange-100 text-orange-700",
  news: "bg-slate-100 text-slate-600",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BlogSkeleton() {
  return (
    <section className="section-shell py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="h-8 w-44 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="flex gap-6 overflow-hidden pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex w-72 shrink-0 flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm sm:w-80"
          >
            <div className="relative h-44 animate-pulse bg-slate-200">
              <div className="absolute left-3 top-3 h-5 w-16 animate-pulse rounded-full bg-slate-300" />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-1 flex gap-1">
                <div className="h-4 w-12 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-14 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BlogSlider() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isDummy, setIsDummy] = useState(false);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch("/api/blog", { signal: controller.signal })
      .then((r) => {
        if (!cancelled && r.headers.get("x-blog-source") === "dummy")
          setIsDummy(true);
        return r.json();
      })
      .then((data: BlogPost[]) => {
        if (!cancelled) setPosts(Array.isArray(data) ? data : []);
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

  const scroll = (dir: "left" | "right") => {
    if (!trackRef.current) return;
    const card = trackRef.current.querySelector<HTMLElement>("[data-card]");
    const gap = 24;
    const amount = card ? card.offsetWidth + gap : 340;
    trackRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (loading) return <BlogSkeleton />;
  if (!posts.length) return null;

  return (
    <section className="section-shell py-10" aria-label="Latest from our blog">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          {isDummy && (
            <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
              Sample content · add posts in Admin
            </span>
          )}
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            From our blog
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Travel guides, tips, and destination inspiration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll blog left"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-400 hover:text-teal-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll blog right"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-400 hover:text-teal-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {posts.map((post) => (
          <article
            key={post.id}
            data-card
            className="group relative flex w-72 shrink-0 flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:w-80"
          >
            {/* Cover image */}
            <div className="relative h-44 overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Category badge */}
              <span
                className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.travel}`}
              >
                {CATEGORY_LABELS[post.category] ?? post.category}
              </span>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-2 p-5">
              <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 group-hover:text-teal-700">
                {post.title}
              </h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">
                {post.excerpt}
              </p>

              {/* Tags */}
              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <Tag className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                  {(post.tags as string[]).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{formatDate(post.publishedAt) ?? post.author}</span>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                >
                  Read more →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
