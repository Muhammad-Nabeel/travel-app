/**
 * @jest-environment node
 */
jest.mock("../../../prisma/client", () => ({ prisma: {}, createPrismaClient: () => ({}) }));

import { isConnectivityError, markDatabaseUnavailable, shouldBypassDatabase } from "@/lib/db";

describe("isConnectivityError", () => {
    it("detects Prisma and socket connectivity codes, including wrapped causes", () => {
        expect(isConnectivityError(Object.assign(new Error("x"), { code: "P1001" }))).toBe(true);
        expect(isConnectivityError(new Error("wrapped", { cause: Object.assign(new Error("y"), { code: "ECONNREFUSED" }) }))).toBe(true);
        expect(isConnectivityError(new Error("Timed out fetching a new connection from the connection pool"))).toBe(true);
    });

    it("ignores ordinary errors that merely mention connections", () => {
        expect(isConnectivityError(new Error("Unique constraint failed on connectionId"))).toBe(false);
        expect(isConnectivityError(Object.assign(new Error("Record not found"), { code: "P2025" }))).toBe(false);
        expect(isConnectivityError(new Error("Request timeout while parsing body"))).toBe(false);
    });

    it("opens the breaker on an outage without throwing outside a request", () => {
        process.env.DATABASE_URL = "postgresql://x@localhost/db";
        expect(shouldBypassDatabase()).toBe(false);
        expect(() => markDatabaseUnavailable(Object.assign(new Error("x"), { code: "P1001" }))).not.toThrow();
        expect(shouldBypassDatabase()).toBe(true);
    });
});
