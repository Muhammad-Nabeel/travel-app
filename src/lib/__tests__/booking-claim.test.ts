/**
 * @jest-environment node
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/providers/auth/auth-provider", () => ({ authOptions: {} }));

import { buildBookingClaimUrl, isValidBookingClaim } from "@/lib/bookings/link-user";

beforeAll(() => {
    process.env.NEXTAUTH_SECRET = "test-secret";
});

function signatureFrom(url: string) {
    return new URL(url).searchParams.get("sig") ?? "";
}

describe("booking claim links", () => {
    it("accepts the link for the email the booking was made with (any case)", () => {
        const sig = signatureFrom(buildBookingClaimUrl("bk_1", "Ali@Example.com"));
        expect(isValidBookingClaim("bk_1", "ali@example.com", sig)).toBe(true);
    });

    it("rejects the link for another booking or another email", () => {
        const sig = signatureFrom(buildBookingClaimUrl("bk_1", "ali@example.com"));
        expect(isValidBookingClaim("bk_2", "ali@example.com", sig)).toBe(false);
        expect(isValidBookingClaim("bk_1", "someone@example.com", sig)).toBe(false);
        expect(isValidBookingClaim("bk_1", "ali@example.com", "forged")).toBe(false);
    });
});
