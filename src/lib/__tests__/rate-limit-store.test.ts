/**
 * @jest-environment node
 */
const mockQueryRaw = jest.fn();
jest.mock("../../../prisma/client", () => ({
    prisma: { $queryRaw: (...args: unknown[]) => mockQueryRaw(...args), $executeRaw: jest.fn() },
    createPrismaClient: () => ({}),
}));

import { markDatabaseUnavailable } from "@/lib/db";
import { hitRateLimit } from "@/lib/rate-limit-store";

const rule = { id: "test", limit: 5, windowMs: 60_000 };

describe("hitRateLimit during a database outage", () => {
    beforeEach(() => {
        process.env.DATABASE_URL = "postgresql://x@localhost/db";
        mockQueryRaw.mockReset();
    });

    it("opens the breaker on a connection failure and falls back to memory", async () => {
        mockQueryRaw.mockRejectedValueOnce(Object.assign(new Error("down"), { code: "ECONNREFUSED" }));
        jest.spyOn(console, "error").mockImplementation(() => {});

        await expect(hitRateLimit(rule, "1.2.3.4")).resolves.toEqual({ ok: true, remaining: 4 });
        expect(mockQueryRaw).toHaveBeenCalledTimes(1);

        // Breaker is open now: the next visitor doesn't wait on the database.
        await expect(hitRateLimit(rule, "1.2.3.4")).resolves.toEqual({ ok: true, remaining: 3 });
        expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    });

    it("skips the query entirely while the breaker is open", async () => {
        markDatabaseUnavailable(Object.assign(new Error("down"), { code: "P1001" }));
        await hitRateLimit(rule, "5.6.7.8");
        expect(mockQueryRaw).not.toHaveBeenCalled();
    });
});
