import { z } from "zod";

import { seoFields } from "@/lib/validations/seo";
import { toDestinationFaqs, type DestinationFaq } from "@/lib/validations/destination";

/** Optional one-line fact: blank input is stored as null and the fact is hidden. */
const optionalFact = (label: string, max: number) =>
    z
        .string()
        .max(max, `${label} must be under ${max} characters`)
        .transform((val) => (val.trim() ? val.trim() : null))
        .nullable()
        .optional();

const stringList = (label: string, maxItems: number, maxLength: number) =>
    z
        .array(
            z
                .string()
                .trim()
                .min(1)
                .max(maxLength, `Each ${label} item must be under ${maxLength} characters`),
        )
        .max(maxItems, `${label} can include up to ${maxItems} items`)
        .default([]);

export const activitySchema = z.object({
    destinationId: z
        .string()
        .min(1, "Destination is required"),
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be under 100 characters")
        .trim(),
    category: z
        .enum(["tourist-attraction", "seaside", "cultural", "adventure", "food", "shopping"])
        .default("tourist-attraction"),
    description: z
        .string()
        .trim()
        .min(20, "Description must be at least 20 characters")
        .max(500, "Description must be under 500 characters"),
    imageUrl: z
        .string()
        .url("Image URL must be a valid URL")
        .min(1, "Image URL is required"),
    cost: z
        .string()
        .min(1, "Cost is required")
        .max(40, "Cost must be under 40 characters")
        .trim(),
    duration: optionalFact("Duration", 60),
    openingHours: optionalFact("Opening hours", 120),
    location: optionalFact("Location", 160),
    bestTimeToVisit: optionalFact("Best time to visit", 120),
    highlights: stringList("Highlights", 10, 160),
    included: stringList("Included", 12, 160),
    excluded: stringList("Not included", 12, 160),
    itinerary: stringList("What to expect", 12, 240),
    importantInfo: stringList("Know before you go", 12, 240),
    cancellationPolicy: optionalFact("Cancellation policy", 600),
    faqs: z
        .array(
            z.object({
                question: z
                    .string()
                    .trim()
                    .min(5, "Each FAQ question needs at least 5 characters")
                    .max(200, "FAQ questions must be under 200 characters"),
                answer: z
                    .string()
                    .trim()
                    .min(10, "Each FAQ answer needs at least 10 characters")
                    .max(1000, "FAQ answers must be under 1000 characters"),
            }),
        )
        .max(10, "Up to 10 FAQs per activity")
        .default([]),
    reviews: z
        .number()
        .min(0, "Reviews must be between 0 and 5")
        .max(5, "Reviews must be between 0 and 5")
        .default(0),
    reviewCount: z
        .number()
        .int()
        .min(0, "Review count must be positive")
        .default(0),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
    ...seoFields,
}).refine(
    // A review count without a real rating would show the placeholder 0 (or
    // whatever was left in the field) next to genuine review numbers.
    (data) => data.reviewCount === 0 || data.reviews >= 1,
    { path: ["reviews"], message: "Enter the real rating (1–5) when there are reviews" },
);

export type ActivityInput = z.infer<typeof activitySchema>;

export type ActivityFaq = DestinationFaq;

/** Reads a stored JSON string list, skipping malformed entries. */
export function toStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter(
        (item): item is string => typeof item === "string" && item.trim() !== "",
    );
}

/** Reads the stored FAQ JSON column into FAQ items, skipping malformed entries. */
export const toActivityFaqs = toDestinationFaqs;
