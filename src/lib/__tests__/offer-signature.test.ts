/**
 * @jest-environment node
 */
import { OFFER_TTL_MS, signOffers, verifyOffer } from "@/lib/flights/offer-signature";
import type { FlightOffer } from "@/lib/flights/types";

const pax = { adults: 2, children: 1, infants: 0 };

const offer: FlightOffer = {
    id: "sabre-1",
    provider: "Sabre",
    airline: "PK",
    origin: "LHE",
    destination: "JED",
    departure: "2026-12-01T08:00:00.000Z",
    arrival: "2026-12-01T13:00:00.000Z",
    stops: 0,
    cabin: "Economy",
    price: 250000,
    currency: "PKR",
    legs: [],
};

beforeAll(() => {
    process.env.NEXTAUTH_SECRET = "test-secret";
});

function signed(now = new Date()) {
    // A JSON round trip, as the offer takes through sessionStorage.
    return JSON.parse(JSON.stringify(signOffers([offer], pax, now)[0])) as FlightOffer;
}

describe("offer signature", () => {
    it("accepts an untouched offer after a JSON round trip", () => {
        expect(verifyOffer(signed(), pax)).toEqual({ ok: true });
    });

    it("rejects a changed price", () => {
        expect(verifyOffer({ ...signed(), price: 1 }, pax)).toEqual({
            ok: false,
            reason: "tampered",
        });
    });

    it("rejects a changed passenger mix", () => {
        expect(verifyOffer(signed(), { ...pax, adults: 5 })).toEqual({
            ok: false,
            reason: "tampered",
        });
    });

    it("rejects an unsigned offer", () => {
        expect(verifyOffer(offer, pax)).toEqual({ ok: false, reason: "unsigned" });
    });

    it("rejects an expired quote", () => {
        const old = new Date(Date.now() - OFFER_TTL_MS - 1000);
        expect(verifyOffer(signed(old), pax)).toEqual({ ok: false, reason: "expired" });
    });
});
