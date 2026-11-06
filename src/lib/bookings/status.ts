import type { BookingStatus } from "@prisma/client";

/** Pipeline order shown in admin dropdowns and filters. */
export const BOOKING_STATUSES = ["OPEN", "PROCESSING", "SUCCESS", "LOST"] as const satisfies readonly BookingStatus[];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    OPEN: "Open",
    PROCESSING: "Processing",
    SUCCESS: "Success",
    LOST: "Lost",
};

export const BOOKING_STATUS_TONES: Record<BookingStatus, string> = {
    OPEN: "bg-brand-soft text-brand-strong",
    PROCESSING: "bg-gold/10 text-gold-strong",
    SUCCESS: "bg-success/8 text-success",
    LOST: "bg-deal/6 text-deal",
};

export function isBookingStatus(value: unknown): value is BookingStatus {
    return typeof value === "string" && (BOOKING_STATUSES as readonly string[]).includes(value);
}
