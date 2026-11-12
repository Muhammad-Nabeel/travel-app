import { createHmac, timingSafeEqual } from "node:crypto";

import { getServerSession } from "next-auth";

import { absoluteUrl } from "@/lib/seo";
import { authOptions } from "@/lib/providers/auth/auth-provider";

/**
 * A booking belongs to an account only when it was made while signed in, or
 * when its owner claims it through the link in the confirmation email while
 * signed in with that same (verified) email. Guest bookings are never
 * attached just because someone typed an email address, which would let
 * anyone put bookings into another person's dashboard.
 */
export async function resolveBookingUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string } | undefined)?.id ?? null;
}

function claimSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("NEXTAUTH_SECRET is required to sign booking claim links.");
    return secret;
}

function claimSignature(bookingId: string, email: string): string {
    return createHmac("sha256", claimSecret())
        .update(`booking-claim:v1:${bookingId}:${email.trim().toLowerCase()}`)
        .digest("base64url");
}

/** Link for the guest confirmation email: adds the booking to the account with this email. */
export function buildBookingClaimUrl(bookingId: string, email: string): string {
    const params = new URLSearchParams({ booking: bookingId, sig: claimSignature(bookingId, email) });
    return absoluteUrl(`/dashboard/bookings/claim?${params.toString()}`);
}

export function isValidBookingClaim(bookingId: string, email: string, signature: string): boolean {
    const expected = Buffer.from(claimSignature(bookingId, email));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
