"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { BlogSearch } from "@/components/features/blog/blog-search";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function BlogDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="section-shell">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content skeleton */}
          <div className="space-y-6 lg:col-span-2">
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-96 w-full animate-pulse rounded-lg bg-slate-200" />
            <div className="space-y-3">
              <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-4">
            <div className="h-40 w-full animate-pulse rounded-lg bg-slate-200" />
            <div className="h-40 w-full animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/blog/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load blog post");
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <BlogDetailSkeleton />;

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="section-shell">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-700 font-semibold mb-4">
              {error || "Blog post not found"}
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="section-shell">
        {/* Back button */}
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <article className="space-y-6 lg:col-span-2">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.travel
                  }`}
                >
                  {CATEGORY_LABELS[post.category] ?? post.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                {post.title}
              </h1>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 border-t border-b border-slate-200 py-3 text-sm text-slate-600">
                {formattedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{post.author}</span>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    <span>{(post.tags as string[]).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Featured image */}
            <div className="relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full object-cover"
                style={{ maxHeight: "400px" }}
              />
            </div>

            {/* Content */}
            <div
              className="space-y-4 text-slate-700 leading-relaxed"
              style={
                {
                  "--content-color": "rgb(55, 65, 81)" /* slate-700 */,
                } as React.CSSProperties
              }
            >
              <style>{`
                .blog-content h1 {
                  font-size: 2em;
                  font-weight: bold;
                  margin-top: 1.5em;
                  margin-bottom: 0.5em;
                  color: rgb(15, 23, 42);
                }
                .blog-content h2 {
                  font-size: 1.5em;
                  font-weight: bold;
                  margin-top: 1.25em;
                  margin-bottom: 0.5em;
                  color: rgb(15, 23, 42);
                }
                .blog-content h3 {
                  font-size: 1.25em;
                  font-weight: 600;
                  margin-top: 1em;
                  margin-bottom: 0.5em;
                  color: rgb(30, 41, 59);
                }
                .blog-content p {
                  line-height: 1.75;
                  margin-bottom: 1em;
                }
                .blog-content ul {
                  list-style-type: disc;
                  margin-left: 1.5em;
                  margin-bottom: 1em;
                  line-height: 1.75;
                }
                .blog-content ol {
                  list-style-type: decimal;
                  margin-left: 1.5em;
                  margin-bottom: 1em;
                  line-height: 1.75;
                }
                .blog-content li {
                  margin-bottom: 0.5em;
                }
                .blog-content strong {
                  font-weight: 600;
                  color: rgb(15, 23, 42);
                }
                .blog-content em {
                  font-style: italic;
                }
                .blog-content a {
                  color: rgb(13, 148, 136);
                  text-decoration: underline;
                }
                .blog-content a:hover {
                  color: rgb(8, 145, 134);
                }
              `}</style>
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Author info box */}
            <div className="mt-8 rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 p-6 border border-teal-100">
              <div className="flex gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    About the Author
                  </h3>
                  <p className="text-sm text-slate-600">
                    <strong>{post.author}</strong> is committed to providing
                    authentic travel guides and insights to help travelers make
                    informed decisions for their journeys.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-8 lg:h-min">
            <BlogSearch currentSlug={post.slug} />
          </aside>
        </div>
      </div>
    </div>
  );
}
