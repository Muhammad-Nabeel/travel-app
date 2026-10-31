import { z } from "zod";

import { seoFields } from "@/lib/validations/seo";

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
        .max(500, "Description must be under 500 characters")
        .trim()
        .nullable()
        .optional(),
    imageUrl: z
        .string()
        .url("Image URL must be a valid URL")
        .min(1, "Image URL is required"),
    cost: z
        .string()
        .min(1, "Cost is required")
        .max(40, "Cost must be under 40 characters")
        .trim(),
    reviews: z
        .number()
        .min(0, "Reviews must be between 0 and 5")
        .max(5, "Reviews must be between 0 and 5")
        .default(4.5),
    reviewCount: z
        .number()
        .int()
        .min(0, "Review count must be positive")
        .default(0),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
    ...seoFields,
});

export type ActivityInput = z.infer<typeof activitySchema>;
