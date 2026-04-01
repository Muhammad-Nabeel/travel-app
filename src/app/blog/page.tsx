"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ArrowRight, X } from "lucide-react";

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
  travel: "bg-teal-100 text-teal-700 border-teal-300",
  umrah: "bg-emerald-100 text-emerald-700 border-emerald-300",
  flights: "bg-sky-100 text-sky-700 border-sky-300",
  hotels: "bg-violet-100 text-violet-700 border-violet-300",
  destinations: "bg-amber-100 text-amber-700 border-amber-300",
  tips: "bg-orange-100 text-orange-700 border-orange-300",
  news: "bg-slate-100 text-slate-600 border-slate-300",
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  travel: "bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200",
  umrah:
    "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
  flights: "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200",
  hotels: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200",
  destinations:
    "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200",
  tips: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200",
  news: "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200",
};

function BlogSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="section-shell">
        <div className="mb-12 space-y-3">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-5 w-96 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="h-48 w-full animate-pulse bg-slate-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blog?all=true")
      .then((r) => r.json())
      .then((data) => {
        console.log("Blog API response:", data);
        console.log("Is array:", Array.isArray(data));
        console.log("Data length:", data?.length);
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Blog fetch error:", err);
        setLoading(false);
      });
  }, []);

  // Get unique categories from posts
  const allCategories = Array.from(
    new Set(posts.map((post) => post.category)),
  ).sort();

  // Filter posts by selected category
  const filteredPosts = selectedCategory
    ? posts.filter((post) => post.category === selectedCategory)
    : posts;

  if (loading) return <BlogSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="section-shell">
        {/* Header */}
        <div className="mb-12 space-y-3">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Travel Blog
          </h1>
          <p className="text-lg text-slate-600">
            Discover travel tips, destination guides, and insider advice from
            our experienced travel experts.
          </p>
        </div>

        {/* Category Filter */}
        {allCategories.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Filter by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition border ${
                  selectedCategory === null
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                All Categories
                {selectedCategory === null && <X className="h-3.5 w-3.5" />}
              </button>
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
                    selectedCategory === category
                      ? CATEGORY_COLORS[category] || "bg-slate-100"
                      : CATEGORY_BADGE_COLORS[category] ||
                        "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  {CATEGORY_LABELS[category] || category}
                </button>
              ))}
            </div>
            {selectedCategory && (
              <p className="text-sm text-slate-500">
                Showing {filteredPosts.length} post
                {filteredPosts.length !== 1 ? "s" : ""} in{" "}
                <strong>
                  {CATEGORY_LABELS[selectedCategory] || selectedCategory}
                </strong>
              </p>
            )}
          </div>
        )}

        {/* Blog Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-lg hover:border-slate-300"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.travel
                    }`}
                  >
                    {CATEGORY_LABELS[post.category] ?? post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="text-base font-bold leading-snug text-slate-900 group-hover:text-teal-700 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString(
                              "en-GB",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : ""}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-teal-600 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">
              {selectedCategory
                ? `No blog posts found in ${
                    CATEGORY_LABELS[selectedCategory] || selectedCategory
                  }`
                : "No blog posts available yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
