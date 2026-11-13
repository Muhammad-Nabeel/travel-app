/**
 * @jest-environment node
 */
const mockFindFirst = jest.fn();
jest.mock("@/lib/db", () => ({
    prisma: { umrahPackage: { findFirst: (...args: unknown[]) => mockFindFirst(...args) } },
}));

import { priceServiceRequest } from "@/lib/bookings/service-request-pricing";

const valid = { packageId: "pkg-1", adults: 2, childCount: 0, nights: 14 };

describe("priceServiceRequest for Umrah", () => {
    beforeEach(() => mockFindFirst.mockReset());

    it.each([
        ["a stay length the page doesn't offer", { nights: 3 }],
        ["more adults than the page allows", { adults: 21 }],
        ["more children than the page allows", { childCount: 13 }],
    ])("rejects %s without reading the package", async (_label, override) => {
        const result = await priceServiceRequest("UMRAH", { ...valid, ...override });
        expect(result.ok).toBe(false);
        expect(mockFindFirst).not.toHaveBeenCalled();
    });

    it("accepts the options the page offers", async () => {
        mockFindFirst.mockResolvedValue(null);
        const result = await priceServiceRequest("UMRAH", { ...valid, adults: 20, childCount: 12, nights: 28 });
        // Got as far as the package lookup.
        expect(mockFindFirst).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ ok: false, error: "This package is no longer available." });
    });
});
