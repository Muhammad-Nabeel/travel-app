import { prisma, shouldBypassDatabase } from "@/lib/db";

export type WiseReturnSnapshot = {
    reference: string;
    bookingStatus: string;
    paymentStatus: string;
    updatedAt: Date;
} | null;

export async function getWiseReturnSnapshot(
    bookingReference: string,
): Promise<WiseReturnSnapshot> {
    if (!bookingReference || shouldBypassDatabase()) {
        return null;
    }

    const booking = await prisma.booking.findUnique({
        where: { reference: bookingReference },
        select: {
            reference: true,
            status: true,
            paymentData: true,
            updatedAt: true,
        },
    });

    if (!booking) {
        return null;
    }

    const paymentStatus =
        booking.paymentData &&
        typeof booking.paymentData === "object" &&
        !Array.isArray(booking.paymentData) &&
        typeof (booking.paymentData as { status?: unknown }).status === "string"
            ? String((booking.paymentData as { status?: string }).status)
            : "PENDING_CHECKOUT";

    return {
        reference: booking.reference,
        bookingStatus: booking.status,
        paymentStatus,
        updatedAt: booking.updatedAt,
    };
}
