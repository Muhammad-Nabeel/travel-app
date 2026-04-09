import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as typeof globalThis & {
    prisma?: PrismaClient;
};

const DEFAULT_POOL_MAX = process.env.NODE_ENV === "development" ? 3 : 10;

function createSanitizedConnectionUrl() {
    const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL or DIRECT_URL environment variable is not set");
    }

    // Supabase URLs often include sslmode in the query string, which can override
    // explicit SSL config. Strip it and pass SSL settings directly.
    return connectionString
        .replace(/[?&]sslmode=[^&]*/g, "")
        .replace(/[?&]pgbouncer=true/g, "")
        .replace(/[?&]$/, "");
}

function createPool() {
    const parsedPoolMax = Number(process.env.PG_POOL_MAX);
    const max = Number.isFinite(parsedPoolMax) && parsedPoolMax > 0
        ? parsedPoolMax
        : DEFAULT_POOL_MAX;

    return new Pool({
        connectionString: createSanitizedConnectionUrl(),
        ssl: { rejectUnauthorized: false },
        max,
        idleTimeoutMillis: 10_000,
        allowExitOnIdle: true,
    });
}

function buildPrismaClient() {
    const adapter = new PrismaPg(createPool(), {
        disposeExternalPool: true,
    });

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

export function createPrismaClient() {
    return buildPrismaClient();
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}