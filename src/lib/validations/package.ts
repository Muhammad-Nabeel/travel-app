import { z } from "zod";

export const packageSchema = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(120, "Title must be under 120 characters")
        .trim(),
    subtitle: z
        .string()
        .max(200, "Subtitle must be under 200 characters")
        .trim()
        .nullable()
        .optional(),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .trim(),
    makkahNights: z.coerce
        .number()
        .int()
        .min(1, "Makkah nights must be at least 1"),
    madinahNights: z.coerce
        .number()
        .int()
        .min(0, "Madinah nights cannot be negative"),
    departureCity: z
        .string()
        .min(2, "Departure city is required")
        .trim(),
    airlineNotes: z
        .string()
        .max(300)
        .trim()
        .nullable()
        .optional(),
    hotelSummary: z
        .string()
        .max(300)
        .trim()
        .nullable()
        .optional(),
    inclusions: z
        .array(z.string().min(1))
        .min(1, "At least one inclusion is required"),
    exclusions: z
        .array(z.string())
        .default([]),
    basePrice: z.coerce
        .number()
        .positive("Base price must be positive"),
    currency: z
        .string()
        .length(3, "Currency must be a 3-letter code")
        .default("SAR"),
    seatsAvailable: z.coerce
        .number()
        .int()
        .min(0, "Seats available cannot be negative")
        .default(0),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    status: z
        .enum(["DRAFT", "PUBLISHED", "ARCHIVED"])
        .default("DRAFT"),
});

export type PackageInput = z.infer<typeof packageSchema>;
