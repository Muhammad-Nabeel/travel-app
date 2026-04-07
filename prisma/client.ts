import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as typeof globalThis & {
    prisma?: PrismaClient;
};

function createSanitizedConnectionUrl() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DIRECT_URL or DATABASE_URL environment variable is not set");
    }

    // Supabase URLs often include sslmode in the query string, which can override
    // explicit SSL config. Strip it and pass SSL settings directly.
    return connectionString
        .replace(/[?&]sslmode=[^&]*/g, "")
        .replace(/[?&]pgbouncer=true/g, "")
        .replace(/[?&]$/, "");
}

export function createPrismaClient() {
    const sanitizedUrl = createSanitizedConnectionUrl();

    const pool = new Pool({
        connectionString: sanitizedUrl,
        ssl: { rejectUnauthorized: false },
    });

    const adapter = new PrismaPg(pool, {
        disposeExternalPool: true,
    });

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

function getPrismaClient() {
    const sanitizedUrl = createSanitizedConnectionUrl();

    const pool = new Pool({
        connectionString: sanitizedUrl,
        ssl: { rejectUnauthorized: false },
    });

    const adapter = new PrismaPg(pool, {
        disposeExternalPool: true,
    });
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}