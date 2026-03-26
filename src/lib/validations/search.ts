import { z } from "zod";

export const flightSearchSchema = z.object({
    origin: z.string().min(3).max(3).transform((value) => value.toUpperCase()),
    destination: z.string().min(3).max(3).transform((value) => value.toUpperCase()),
    departureDate: z.string().min(10),
    adults: z.coerce.number().int().min(1).max(9).default(1),
});

export const hotelSearchSchema = z.object({
    city: z.string().min(2),
    checkInDate: z.string().min(10),
    checkOutDate: z.string().min(10),
    guests: z.coerce.number().int().min(1).max(8).default(2),
});