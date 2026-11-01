import { CalendarDays, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CardCarousel } from "@/components/shared/card-carousel";
import { getPublishedBlogPosts } from "@/lib/blog";

const CATEGORY_LABELS: Record<string, string> = {
  travel: "Travel",
  umrah: "Umrah",
  flights: "Flights",
  hotels: "Hotels",
  destinations: "Destinations",
  tips: "Tips",
  news: "News",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function BlogSlider() {
  const posts = await getPublishedBlogPosts();
  if (!posts.length) return null;

  return (
    <CardCarousel
      ariaLabel="Latest from our blog"
      title="Travel inspiration"
      subtitle="Guides, tips and destination ideas from our team"
      href="/blog"
      hrefLabel="Visit the blog"
      scrollLabel="blog posts"
    >
      {posts.map((post) => (
        <article
          key={post.id}
          className="group relative flex w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-raised sm:w-80"
        >
          {/* Cover image */}
          <div className="relative aspect-video overflow-hidden bg-subtle">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              sizes="(min-width: 640px) 320px, 82vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            {/* Category badge */}
            <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground shadow-card">
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-2 p-5">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-brand">
              {post.title}
            </h3>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted">
              {post.excerpt}
            </p>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                <Tag className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                {post.tags.slice(0, 3).map((tag) => (
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
                className="text-sm font-semibold text-brand after:absolute after:inset-0 hover:text-brand-strong"
              >
                Read more →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </CardCarousel>
  );
}
