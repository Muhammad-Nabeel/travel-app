import type { BlogPost as PrismaBlogPost } from "@prisma/client";
import { cache } from "react";

import {
  DUMMY_BLOG_POSTS,
  type BlogPostRow,
} from "@/app/api/blog/route";
import {
  markDatabaseUnavailable,
  prisma,
  shouldBypassDatabase,
} from "@/lib/db";

export type BlogPostRecord = {
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

function parseTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toRecord(row: BlogPostRow | PrismaBlogPost): BlogPostRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
    author: row.author,
    category: row.category,
    tags: parseTags(row.tags),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Demo posts are for local development only. In production an empty blog is
// better than indexed placeholder articles (thin, duplicate content).
const ALLOW_DEMO_POSTS = process.env.NODE_ENV !== "production";

function getDummyPosts() {
  if (!ALLOW_DEMO_POSTS) {
    return [] as BlogPostRecord[];
  }

  return DUMMY_BLOG_POSTS.filter((post) => post.status === "PUBLISHED")
    .sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? 0;
      const bTime = b.publishedAt?.getTime() ?? 0;
      return bTime - aTime || a.sortOrder - b.sortOrder;
    })
    .map(toRecord);
}

/** True for the local-development placeholder posts. */
export function isDemoPost(post: Pick<BlogPostRecord, "id">) {
  return DUMMY_BLOG_POSTS.some((demo) => demo.id === post.id);
}

export const getPublishedBlogPosts = cache(async () => {
  if (shouldBypassDatabase()) {
    return getDummyPosts();
  }

  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
    });

    if (posts.length === 0) {
      return getDummyPosts();
    }

    return posts.map(toRecord);
  } catch (error) {
    markDatabaseUnavailable(error);
    return getDummyPosts();
  }
});

export const getPublishedBlogPostBySlug = cache(async (slug: string) => {
  const findDummy = () => getDummyPosts().find((post) => post.slug === slug) ?? null;

  if (shouldBypassDatabase()) {
    return findDummy();
  }

  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
    });

    return post ? toRecord(post) : findDummy();
  } catch (error) {
    markDatabaseUnavailable(error);
    return findDummy();
  }
});