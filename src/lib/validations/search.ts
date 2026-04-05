import { z } from "zod";

const TRIP_TYPES = ["one-way", "round-trip", "multi-city"] as const;
const CABIN_CLASSES = [
    "Economy",
    "Premium Economy",
    "Business",
    "First",
] as const;

const airportCodeSchema = z
    .string()
    .min(1)
    .trim()
    .transform((value) => {
        const upper = value.toUpperCase();
        const match = upper.match(/[A-Z]{3}/);
        return match ? match[0] : upper;
    })
    .refine((val) => /^[A-Z]{3}$/.test(val), "Must be a valid 3-letter airport code");

const dateSchema = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Date must be in YYYY-MM-DD format");

const multiCityLegSchema = z.object({
    origin: airportCodeSchema,
    destination: airportCodeSchema,
    departureDate: dateSchema,
});

export const flightSearchSchema = z.object({
    tripType: z.enum(TRIP_TYPES).default("one-way"),
    origin: airportCodeSchema,
    destination: airportCodeSchema,
    departureDate: dateSchema,
    returnDate: z
        .string()
        .refine(
            (val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val),
            "Return date must be in YYYY-MM-DD format or empty"
        )
        .optional(),
    legs: z.array(multiCityLegSchema).min(2).max(6).optional(),
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
    if (value.tripType === "multi-city") {
        if (!value.legs || value.legs.length < 2) {
            ctx.addIssue({
                code: "custom",
                path: ["legs"],
                message: "At least two legs are required for multi-city search.",
            });
        }

        for (let i = 0; i < (value.legs?.length ?? 0); i += 1) {
            const leg = value.legs?.[i];
            if (!leg) continue;

            if (leg.origin === leg.destination) {
                ctx.addIssue({
                    code: "custom",
                    path: ["legs", i, "destination"],
                    message: "Destination must be different from origin.",
                });
            }

            if (i > 0) {
                const previous = value.legs?.[i - 1];
                if (previous && leg.departureDate < previous.departureDate) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["legs", i, "departureDate"],
                        message: "Each next leg date must be the same day or later than previous leg.",
                    });
                }
            }
        }
    }

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

    if (value.origin === value.destination && value.tripType !== "multi-city") {
        ctx.addIssue({
            code: "custom",
            path: ["destination"],
            message: "Destination must be different from origin.",
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