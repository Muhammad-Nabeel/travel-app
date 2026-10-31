import { z } from "zod";
import { SITE_NAME } from "@/lib/seo";

export const blogPostSchema = z.object({
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(120, "Slug must be under 120 characters")
        .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens")
        .trim(),
    title: z
        .string()
        .min(2, "Title must be at least 2 characters")
        .max(200, "Title must be under 200 characters")
        .trim(),
    excerpt: z
        .string()
        .min(10, "Excerpt must be at least 10 characters")
        .max(500, "Excerpt must be under 500 characters")
        .trim(),
    content: z.string().min(20, "Content must be at least 20 characters").trim(),
    coverImageUrl: z
        .string()
        .url("Cover image must be a valid URL")
        .max(500, "URL too long"),
    author: z.string().max(100).trim().default(`${SITE_NAME} Travel Team`),
    category: z
        .enum([
            "travel",
            "umrah",
            "flights",
            "hotels",
            "destinations",
            "tips",
            "news",
        ])
        .default("travel"),
    tags: z.array(z.string().max(40).trim()).default([]),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    publishedAt: z.string().datetime().nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
