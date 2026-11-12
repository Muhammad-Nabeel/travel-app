import { readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

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

// Hosts without TLS on Postgres (e.g. cPanel) need sslmode=disable in the URL.
function isSslDisabled() {
    const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
    return /[?&]sslmode=disable\b/.test(connectionString);
}

/**
 * DATABASE_SSL_CA (the PEM text, or a path to the .crt file; for Supabase,
 * "Download certificate" under Database settings) turns on full certificate
 * verification. Without it the connection is encrypted but the server's
 * certificate is not checked.
 */
function sslConfig(): PoolConfig["ssl"] {
    if (isSslDisabled()) return false;

    const ca = process.env.DATABASE_SSL_CA?.trim();
    if (!ca) return { rejectUnauthorized: false };

    const pem = ca.includes("BEGIN CERTIFICATE") ? ca.replace(/\\n/g, "\n") : readFileSync(ca, "utf8");
    return { ca: pem, rejectUnauthorized: true };
}

function createPool() {
    const parsedPoolMax = Number(process.env.PG_POOL_MAX);
    const max = Number.isFinite(parsedPoolMax) && parsedPoolMax > 0
        ? parsedPoolMax
        : DEFAULT_POOL_MAX;

    return new Pool({
        connectionString: createSanitizedConnectionUrl(),
        ssl: sslConfig(),
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

// Shared on globalThis in every environment: the proxy and the app server
// can load this module separately, and each copy would otherwise open its
// own connection pool.
export const prisma = globalForPrisma.prisma ?? buildPrismaClient();
globalForPrisma.prisma = prisma;