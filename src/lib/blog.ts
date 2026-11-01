import type { BlogPost as PrismaBlogPost } from "@prisma/client";
import { cache } from "react";

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

function toRecord(row: PrismaBlogPost): BlogPostRecord {
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

export const getPublishedBlogPosts = cache(async () => {
  if (shouldBypassDatabase()) {
    return [] as BlogPostRecord[];
  }

  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
    });

    return posts.map(toRecord);
  } catch (error) {
    markDatabaseUnavailable(error);
    return [] as BlogPostRecord[];
  }
});

export const getPublishedBlogPostBySlug = cache(async (slug: string) => {
  if (shouldBypassDatabase()) {
    return null;
  }

  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
    });

    return post ? toRecord(post) : null;
  } catch (error) {
    markDatabaseUnavailable(error);
    return null;
  }
});
