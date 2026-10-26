import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag, User } from "lucide-react";

import { BlogSearch } from "@/components/features/blog/blog-search";
import { StructuredData } from "@/components/shared/structured-data";
import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog";
import { getBlogCategoryLabel, getBlogCategoryPath } from "@/lib/blog-categories";
import {
  buildMetadata,
  createArticleSchema,
  createBreadcrumbSchema,
} from "@/lib/seo";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
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

  // Same-category posts first, then shared tags, then most recent: internal
  // links keep readers and crawlers moving through the topic cluster.
  const relatedPosts = posts
    .filter((item) => item.slug !== post.slug)
    .map((item) => ({
      item,
      score:
        (item.category === post.category ? 2 : 0) +
        item.tags.filter((tag) => post.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item);

  const categoryLabel = getBlogCategoryLabel(post.category);
  const categoryPath = getBlogCategoryPath(post.category);

  // The page title is the only H1; demote any H1 an editor typed into the body.
  const content = post.content.replace(/<(\/?)h1(?=[\s>])/gi, "<$1h2");

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
              section: categoryLabel,
            }),
            createBreadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: categoryLabel, path: categoryPath },
              { name: post.title, path: `/blog/${post.slug}` },
            ]),
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
                <Link
                  href={categoryPath}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.travel
                  }`}
                >
                  {categoryLabel}
                </Link>
              </div>
              <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 border-y border-slate-200 py-3 text-sm text-slate-600">
                {formattedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.publishedAt ?? undefined}>
                      {formattedDate}
                    </time>
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
                dangerouslySetInnerHTML={{ __html: content }}
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
            {relatedPosts.length > 0 && (
              <section aria-labelledby="related-articles" className="mt-8">
                <h2
                  id="related-articles"
                  className="mb-4 text-xl font-bold text-slate-900"
                >
                  Related articles
                </h2>
                <ul className="grid gap-4 sm:grid-cols-3">
                  {relatedPosts.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/blog/${item.slug}`}
                        className="block h-full rounded-lg border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-md"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                          {getBlogCategoryLabel(item.category)}
                        </span>
                        <span className="mt-1 line-clamp-3 block text-sm font-semibold text-slate-900">
                          {item.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={categoryPath}
                  className="mt-4 inline-block text-sm font-medium text-teal-700 hover:text-teal-800"
                >
                  More {categoryLabel.toLowerCase()} articles →
                </Link>
              </section>
            )}
          </article>

          <aside className="lg:sticky lg:top-8 lg:h-min">
            <BlogSearch currentSlug={post.slug} />
          </aside>
        </div>
      </div>
    </div>
  );
}
