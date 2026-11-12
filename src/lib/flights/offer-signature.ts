import { createHmac, timingSafeEqual } from "node:crypto";

import type { FlightOffer, FlightSearchQuery } from "@/lib/flights/types";

/**
 * Offers travel through the browser (sessionStorage) between search and
 * payment, so the booking route cannot trust their price. Each offer is
 * signed on the server when a search returns it; the booking route only
 * accepts offers whose signature still matches, so an edited price, a
 * swapped itinerary or a changed passenger count is rejected.
 */

/** How long a quoted fare can be booked before the customer must search again. */
export const OFFER_TTL_MS = 2 * 60 * 60 * 1000;

type PassengerMix = Pick<FlightSearchQuery, "adults" | "children" | "infants">;

function signingKey(): string {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error("NEXTAUTH_SECRET is required to sign flight offers.");
    }
    return secret;
}

/** JSON with sorted keys, so the signature survives a JSON round trip in any key order. */
function stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(",")}]`;
    }
    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => v !== undefined)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
        return `{${entries
            .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
}

function computeSignature(offer: FlightOffer, pax: PassengerMix): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { signature, ...unsigned } = offer;
    const message = stableStringify({
        offer: unsigned,
        pax: { adults: pax.adults, children: pax.children, infants: pax.infants },
    });
    return createHmac("sha256", signingKey())
        .update(`flight-offer:v1:${message}`)
        .digest("base64url");
}

export function signOffers(
    offers: FlightOffer[],
    pax: PassengerMix,
    now: Date = new Date(),
): FlightOffer[] {
    const signedAt = now.toISOString();
    return offers.map((offer) => {
        const withTime: FlightOffer = { ...offer, signedAt, signature: undefined };
        return { ...withTime, signature: computeSignature(withTime, pax) };
    });
}

export type OfferVerification =
    | { ok: true }
    | { ok: false; reason: "unsigned" | "tampered" | "expired" };

export function verifyOffer(
    offer: FlightOffer,
    pax: PassengerMix,
    now: Date = new Date(),
): OfferVerification {
    if (!offer.signature || !offer.signedAt) {
        return { ok: false, reason: "unsigned" };
    }

    const expected = Buffer.from(computeSignature(offer, pax));
    const actual = Buffer.from(offer.signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        return { ok: false, reason: "tampered" };
    }

    const signedAt = Date.parse(offer.signedAt);
    if (!Number.isFinite(signedAt) || now.getTime() - signedAt > OFFER_TTL_MS) {
        return { ok: false, reason: "expired" };
    }

    return { ok: true };
}
