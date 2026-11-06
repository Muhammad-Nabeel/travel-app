import { z } from "zod";

import { seoFields } from "@/lib/validations/seo";

const iata = (label: string) =>
    z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{3}$/, `${label} must be a 3-letter IATA code`);

const text = (label: string, min: number, max: number) =>
    z
        .string()
        .trim()
        .min(min, `${label} must be at least ${min} characters`)
        .max(max, `${label} must be under ${max} characters`);

export const flightRouteAirlineSchema = z.object({
    name: text("Airline name", 2, 60),
    code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{2}$/, "Airline code must be the 2-character IATA code (e.g. SV)"),
    /** "Non-stop" or "1 stop via Dubai". */
    service: text("Airline service", 3, 60),
});

export const flightRouteFaqSchema = z.object({
    question: text("FAQ question", 5, 200),
    answer: text("FAQ answer", 10, 1000),
});

export const flightRouteSchema = z
    .object({
        originCity: text("Origin city", 2, 60),
        originIata: iata("Origin airport code"),
        originAirport: text("Origin airport name", 5, 120),
        destinationCity: text("Destination city", 2, 60),
        destinationCountry: text("Destination country", 2, 60),
        destinationIata: iata("Destination airport code"),
        destinationAirport: text("Destination airport name", 5, 120),
        intro: text("Introduction", 200, 5000),
        flightTime: text("Flight time", 3, 80),
        distance: text("Distance", 3, 40),
        airlines: z
            .array(flightRouteAirlineSchema)
            .min(1, "Add at least one airline")
            .max(15, "Up to 15 airlines"),
        travelTips: z.array(text("Travel tip", 5, 300)).max(10, "Up to 10 travel tips").default([]),
        documents: z.array(text("Document", 3, 200)).max(10, "Up to 10 documents").default([]),
        faqs: z.array(flightRouteFaqSchema).max(10, "Up to 10 FAQs").default([]),
        fareFrom: z
            .string()
            .max(40, "Fare must be under 40 characters")
            .transform((value) => (value.trim() ? value.trim() : null))
            .nullable()
            .optional(),
        isActive: z.boolean().default(false),
        sortOrder: z.coerce.number().int().min(0).default(0),
        ...seoFields,
    })
    .refine((route) => route.originIata !== route.destinationIata, {
        message: "Origin and destination must be different airports",
        path: ["destinationIata"],
    });

export type FlightRouteInput = z.infer<typeof flightRouteSchema>;
export type FlightRouteAirline = z.infer<typeof flightRouteAirlineSchema>;
export type FlightRouteFaq = z.infer<typeof flightRouteFaqSchema>;

/** "Lahore" + "Jeddah" -> "lahore-to-jeddah". */
export function flightRouteSlug(originCity: string, destinationCity: string) {
    const part = (value: string) =>
        value
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[^\w\s-]/g, "")
            .trim()
            .replace(/[\s_-]+/g, "-");
    return `${part(originCity)}-to-${part(destinationCity)}`;
}

export function getFlightRoutePath(slug: string) {
    return `/flights/${slug}`;
}
