import { z } from "zod";

const TRIP_TYPES = ["one-way", "round-trip", "multi-city"] as const;
const CABIN_CLASSES = [
    "Economy",
    "Premium Economy",
    "Business",
    "First",
] as const;

export const flightSearchSchema = z.object({
    tripType: z.enum(TRIP_TYPES).default("one-way"),
    origin: z
        .string()
        .min(1, "Origin is required")
        .trim()
        .transform((value) => {
            const upper = value.toUpperCase();
            // Try to extract 3-letter code from patterns like "Code" or "City (CODE)"
            const match = upper.match(/[A-Z]{3}/);
            return match ? match[0] : upper;
        })
        .refine((val) => /^[A-Z]{3}$/.test(val), "Origin must be a valid 3-letter airport code"),
    destination: z
        .string()
        .min(1, "Destination is required")
        .trim()
        .transform((value) => {
            const upper = value.toUpperCase();
            // Try to extract 3-letter code from patterns like "Code" or "City (CODE)"
            const match = upper.match(/[A-Z]{3}/);
            return match ? match[0] : upper;
        })
        .refine((val) => /^[A-Z]{3}$/.test(val), "Destination must be a valid 3-letter airport code"),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Departure date must be in YYYY-MM-DD format"),
    returnDate: z
        .string()
        .refine(
            (val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val),
            "Return date must be in YYYY-MM-DD format or empty"
        )
        .optional(),
    adults: z.coerce.number().int().min(1).max(9).default(1),
    children: z.coerce.number().int().min(0).max(9).default(0),
    infants: z.coerce.number().int().min(0).max(9).default(0),
    cabinClass: z.enum(CABIN_CLASSES).default("Economy"),
    directOnly: z
        .union([z.boolean(), z.string()])
        .transform((val) => {
            if (typeof val === "boolean") return val;
            return val === "true" || val === "1";
        })
        .default(false),
}).superRefine((value, ctx) => {
    if (value.tripType === "round-trip" && !value.returnDate) {
        ctx.addIssue({
            code: "custom",
            path: ["returnDate"],
            message: "Return date is required for round-trip searches.",
        });
    }

    if (value.returnDate && value.returnDate < value.departureDate) {
        ctx.addIssue({
            code: "custom",
            path: ["returnDate"],
            message: "Return date must be on or after departure date.",
        });
    }

    if (value.infants > value.adults) {
        ctx.addIssue({
            code: "custom",
            path: ["infants"],
            message: "Infants cannot exceed adults.",
        });
    }
});

export const hotelSearchSchema = z.object({
    city: z.string().min(2),
    checkInDate: z.string().min(10),
    checkOutDate: z.string().min(10),
    guests: z.coerce.number().int().min(1).max(8).default(2),
});