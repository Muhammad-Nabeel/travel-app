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

describe("markDatabaseUnavailable during next build", () => {
    const originalPhase = process.env.NEXT_PHASE;
    afterEach(() => {
        process.env.NEXT_PHASE = originalPhase;
    });

    async function loadDbInBuild(): Promise<typeof import("@/lib/db")> {
        process.env.NEXT_PHASE = "phase-production-build";
        let db!: typeof import("@/lib/db");
        await jest.isolateModulesAsync(async () => {
            db = await import("@/lib/db");
        });
        return db;
    }

    it("throws on any Prisma error so fallback content is never prerendered", async () => {
        const db = await loadDbInBuild();
        // An unrecognised Prisma error, like the empty ones seen in a real build.
        const unknown = Object.assign(new Error(""), { name: "PrismaClientUnknownRequestError" });
        expect(() => db.markDatabaseUnavailable(unknown)).toThrow(/during build/);
        expect(() => db.markDatabaseUnavailable(Object.assign(new Error("x"), { code: "P1001" }))).toThrow(/during build/);
    });

    it("leaves non-database errors to the caller", async () => {
        const db = await loadDbInBuild();
        expect(() => db.markDatabaseUnavailable(new SyntaxError("Unexpected token"))).not.toThrow();
    });
});
