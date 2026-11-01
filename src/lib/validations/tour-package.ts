import { z } from "zod";

import { seoFields } from "@/lib/validations/seo";

export const TOUR_TYPES = ["family", "adventure", "cultural", "luxury"] as const;

export const tourPackageSchema = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be under 100 characters")
        .trim(),
    destination: z
        .string()
        .min(2, "Destination is required")
        .max(100, "Destination must be under 100 characters")
        .trim(),
    tourType: z.enum(TOUR_TYPES),
    duration: z.coerce
        .number()
        .int()
        .min(1, "Duration must be at least 1 day")
        .max(60, "Duration must be 60 days or less"),
    description: z
        .string()
        .min(20, "Description must be at least 20 characters")
        .max(2000, "Description must be under 2000 characters")
        .trim(),
    highlights: z
        .array(z.string().trim().min(1))
        .min(1, "At least one highlight is required"),
    // Uploaded images are absolute URLs; images shipped in /public are root-relative.
    imageUrl: z
        .string()
        .trim()
        .min(1, "Image is required")
        .refine(
            (value) => value.startsWith("/") || z.string().url().safeParse(value).success,
            "Image must be a URL or a path starting with /",
        ),
    pricePerAdult: z.coerce.number().positive("Adult price must be positive"),
    pricePerChild: z.coerce.number().min(0, "Child price cannot be negative"),
    currency: z
        .string()
        .trim()
        .length(3, "Currency must be a 3-letter code")
        .transform((value) => value.toUpperCase()),
    rating: z.coerce
        .number()
        .min(0, "Rating must be between 0 and 5")
        .max(5, "Rating must be between 0 and 5"),
    reviewCount: z.coerce.number().int().min(0, "Review count must be positive"),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
    ...seoFields,
});

export type TourPackageInput = z.infer<typeof tourPackageSchema>;
