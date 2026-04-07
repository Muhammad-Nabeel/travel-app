import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag, User } from "lucide-react";

import { BlogSearch } from "@/components/features/blog/blog-search";
import { StructuredData } from "@/components/shared/structured-data";
import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog";
import {
  absoluteUrl,
  buildMetadata,
  createArticleSchema,
  createBreadcrumbSchema,
} from "@/lib/seo";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
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

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return buildMetadata({
      title: "Blog Post Not Found",
      description: "The requested blog post could not be found.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    image: post.coverImageUrl,
    publishedTime: post.publishedAt ?? undefined,
    modifiedTime: post.updatedAt,
    keywords: [...post.tags, post.category, "travel blog"],
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const [post, posts] = await Promise.all([
    getPublishedBlogPostBySlug(slug),
    getPublishedBlogPosts(),
  ]);

  if (!post) {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const relatedPosts = posts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 5)
    .map((item) => ({
      "@type": "ListItem",
      position:
        posts.findIndex((candidate) => candidate.slug === item.slug) + 1,
      name: item.title,
      url: absoluteUrl(`/blog/${item.slug}`),
    }));

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white py-12">
      <div className="section-shell">
        <StructuredData
          data={[
            createArticleSchema({
              title: post.title,
              description: post.excerpt,
              path: `/blog/${post.slug}`,
              image: post.coverImageUrl,
              publishedTime: post.publishedAt,
              modifiedTime: post.updatedAt,
              authorName: post.author,
              keywords: post.tags,
            }),
            createBreadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: post.title, path: `/blog/${post.slug}` },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Related blog posts",
              itemListElement: relatedPosts,
            },
          ]}
        />

        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 font-medium text-teal-600 transition hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <article className="space-y-6 lg:col-span-2">
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

              <div className="flex flex-wrap items-center gap-4 border-y border-slate-200 py-3 text-sm text-slate-600">
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
                {post.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    <span>{post.tags.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full object-cover"
                style={{ maxHeight: "400px" }}
              />
            </div>

            <div
              className="space-y-4 leading-relaxed text-slate-700"
              style={
                {
                  "--content-color": "rgb(55, 65, 81)",
                } as CSSProperties
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

            <div className="mt-8 rounded-lg border border-teal-100 bg-linear-to-r from-teal-50 to-blue-50 p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <h2 className="mb-1 font-semibold text-slate-900">
                    About the Author
                  </h2>
                  <p className="text-sm text-slate-600">
                    <strong>{post.author}</strong> is committed to providing
                    authentic travel guides and insights to help travellers make
                    informed decisions for their journeys.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <aside className="lg:sticky lg:top-8 lg:h-min">
            <BlogSearch currentSlug={post.slug} />
          </aside>
        </div>
      </div>
    </div>
  );
}
