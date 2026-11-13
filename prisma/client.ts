import { readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

import { stripConnectionParams } from "./connection-url";
import { runWithReadRetry } from "./connectivity";

const globalForPrisma = globalThis as typeof globalThis & {
    prisma?: ExtendedPrismaClient;
};

// The database is a shared-hosting Postgres that times out when too many
// connections open at once, so each app process uses at most 3 (pages are
// cached, so few requests reach the database anyway). `next build` renders
// pages in several worker processes at the same time, so each build worker
// uses 2. PG_POOL_MAX overrides both.
const IS_NEXT_BUILD = process.env.NEXT_PHASE === "phase-production-build";
const DEFAULT_POOL_MAX = IS_NEXT_BUILD ? 2 : 3;

function createSanitizedConnectionUrl() {
    const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL or DIRECT_URL environment variable is not set");
    }

    // SSL settings are passed directly instead (see sslConfig).
    return stripConnectionParams(connectionString);
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
        // The database is remote: keep-alive notices connections the server or
        // network dropped instead of hanging a query on a dead socket, and a
        // connect timeout turns a stalled handshake into a quick, retryable error.
        keepAlive: true,
        keepAliveInitialDelayMillis: 10_000,
        connectionTimeoutMillis: 10_000,
    });
}

/**
 * Reads are retried once after a short pause when the connection drops
 * (a remote database closing an idle socket, a brief network blip), so one
 * dropped connection doesn't trip the circuit breaker and blank every
 * database-backed section. Writes are never retried: a write that reached
 * the database before the connection dropped would be applied twice.
 */
function buildPrismaClient() {
    const adapter = new PrismaPg(createPool(), {
        disposeExternalPool: true,
    });

    const base = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    return base.$extends({
        name: "retry-reads-once",
        query: {
            $allModels: {
                $allOperations({ operation, args, query }) {
                    return runWithReadRetry(operation, () => query(args));
                },
            },
        },
    });
}

type ExtendedPrismaClient = ReturnType<typeof buildPrismaClient>;

export function createPrismaClient() {
    return buildPrismaClient();
}

// Shared on globalThis in every environment: the proxy and the app server
// can load this module separately, and each copy would otherwise open its
// own connection pool.
export const prisma = globalForPrisma.prisma ?? buildPrismaClient();
globalForPrisma.prisma = prisma;
