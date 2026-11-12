export { createPrismaClient, prisma } from "../../prisma/client";

const DATABASE_RETRY_COOLDOWN_MS = 30_000;

let databaseUnavailableUntil = 0;

export function isDatabaseConfigured() {
    return Boolean(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
}

export function shouldBypassDatabase() {
    if (!isDatabaseConfigured()) {
        return true;
    }

    return Date.now() < databaseUnavailableUntil;
}

/**
 * Prisma and Postgres driver codes that mean the database itself can't be
 * reached, as opposed to a bad query. Only these open the circuit breaker:
 * matching on words like "connection" used to trip it on unrelated errors.
 */
const CONNECTIVITY_CODES = new Set([
    // Prisma: can't reach server, timeout, server closed the connection, pool timeout
    "P1001",
    "P1002",
    "P1008",
    "P1017",
    "P2024",
    // Node / pg socket errors
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EAI_AGAIN",
    // Postgres: too many connections, cannot connect now, admin shutdown
    "53300",
    "57P03",
    "57P01",
]);

/** Driver messages that carry no code (pg pool and the Prisma pg adapter). */
const CONNECTIVITY_MESSAGES = [
    "can't reach database server",
    "timed out fetching a new connection",
    "connection terminated unexpectedly",
    "timeout exceeded when trying to connect",
];

export function isConnectivityError(error: unknown): boolean {
    // Prisma and the pg adapter wrap the socket error; walk the cause chain.
    for (let current: unknown = error, depth = 0; current && depth < 5; depth += 1) {
        if (typeof current !== "object") break;
        const candidate = current as {
            code?: unknown;
            errorCode?: unknown;
            name?: unknown;
            message?: unknown;
            cause?: unknown;
        };
        if (candidate.name === "PrismaClientInitializationError") return true;
        for (const code of [candidate.code, candidate.errorCode]) {
            if (typeof code === "string" && CONNECTIVITY_CODES.has(code)) return true;
        }
        if (typeof candidate.message === "string") {
            const message = candidate.message.toLowerCase();
            if (CONNECTIVITY_MESSAGES.some((text) => message.includes(text))) return true;
        }
        current = candidate.cause;
    }
    return false;
}

export function markDatabaseUnavailable(error: unknown) {
    if (isConnectivityError(error)) {
        databaseUnavailableUntil = Date.now() + DATABASE_RETRY_COOLDOWN_MS;
    }
}
