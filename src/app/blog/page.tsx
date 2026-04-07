import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

import { StructuredData } from "@/components/shared/structured-data";
import { getPublishedBlogPosts } from "@/lib/blog";
import {
  buildMetadata,
  createBreadcrumbSchema,
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";

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

type BlogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const category = toSingleValue(params.category);
  const hasFilter = Boolean(category);
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  return buildMetadata({
    title: hasFilter ? `${categoryLabel} Travel Blog` : "Travel Blog",
    description: hasFilter
      ? `Read ${categoryLabel.toLowerCase()} guides, updates, and planning advice from Safar Umrah.`
      : "Read destination guides, flight advice, Umrah planning tips, and travel updates from Safar Umrah.",
    path: "/blog",
    keywords: [
      "travel blog",
      "Umrah blog",
      "flight advice",
      "destination guides",
      categoryLabel,
    ],
    noIndex: hasFilter,
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = (await searchParams) ?? {};
  const selectedCategory = toSingleValue(params.category);
  const posts = await getPublishedBlogPosts();

  const allCategories = Array.from(
    new Set(posts.map((post) => post.category)),
  ).sort();

  const filteredPosts = selectedCategory
    ? posts.filter((post) => post.category === selectedCategory)
    : posts;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="section-shell">
        <StructuredData
          data={[
            createWebPageSchema({
              title: selectedCategory
                ? `${CATEGORY_LABELS[selectedCategory] ?? selectedCategory} Travel Blog`
                : "Travel Blog",
              description: selectedCategory
                ? `Read ${(
                    CATEGORY_LABELS[selectedCategory] ?? selectedCategory
                  ).toLowerCase()} guides, updates, and planning advice from Safar Umrah.`
                : "Read destination guides, flight advice, Umrah planning tips, and travel updates from Safar Umrah.",
              path: "/blog",
              type: "CollectionPage",
            }),
            createBreadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
            ]),
            createItemListSchema(
              filteredPosts.map((post) => ({
                name: post.title,
                path: `/blog/${post.slug}`,
              })),
              "Blog posts",
            ),
          ]}
        />

        <div className="mb-12 space-y-3">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Travel Blog
          </h1>
          <p className="text-lg text-slate-600">
            Discover travel tips, destination guides, and insider advice from
            our experienced travel experts.
          </p>
        </div>

        {allCategories.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Filter by Category
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/blog"
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  !selectedCategory
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                All Categories
              </Link>
              {allCategories.map((category) => (
                <Link
                  key={category}
                  href={`/blog?category=${encodeURIComponent(category)}`}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === category
                      ? CATEGORY_COLORS[category] || "bg-slate-100"
                      : CATEGORY_BADGE_COLORS[category] ||
                        "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  {CATEGORY_LABELS[category] || category}
                </Link>
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

        {filteredPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-lg"
              >
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

                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 group-hover:text-teal-700">
                    {post.title}
                  </h2>
                  <p className="line-clamp-3 text-sm text-slate-600">
                    {post.excerpt}
                  </p>

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
                  }.`
                : "No blog posts available yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
