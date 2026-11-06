import type { Prisma } from "@prisma/client";

/** "PKR 770,000", or "To be confirmed" when no price was quoted (null or 0). */
export function formatBookingAmount(amount: Prisma.Decimal | null, currency: string) {
    const value = amount === null ? 0 : Number(amount);
    if (!Number.isFinite(value) || value <= 0) return "To be confirmed";
    return `${currency} ${value.toLocaleString("en-US")}`;
}
