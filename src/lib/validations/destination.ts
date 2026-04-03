import { z } from "zod";

export const destinationSchema = z.object({
    city: z
        .string()
        .min(2, "City must be at least 2 characters")
        .max(80, "City must be under 80 characters")
        .trim(),
    country: z
        .string()
        .min(2, "Country must be at least 2 characters")
        .max(80, "Country must be under 80 characters")
        .trim(),
    iataCode: z
        .string()
        .max(4, "IATA code must be 4 characters or less")
        .transform((val) => (val.trim() ? val.trim().toUpperCase() : null))
        .nullable()
        .optional(),
    imageUrl: z
        .string()
        .max(500, "Image URL must be under 500 characters")
        .transform((val) => (val.trim() ? val.trim() : null))
        .nullable()
        .optional(),
    fare: z
        .string()
        .min(1, "Fare is required")
        .max(40, "Fare must be under 40 characters")
        .trim(),
    notes: z
        .string()
        .max(120, "Notes must be under 120 characters")
        .trim()
        .nullable()
        .optional(),
    gradient: z
        .enum(["blue", "dark", "ocean", "purple", "teal", "sunset", "navy"])
        .default("blue"),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
});

export type DestinationInput = z.infer<typeof destinationSchema>;
