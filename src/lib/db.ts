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

export function markDatabaseUnavailable(error: unknown) {
    if (!(error instanceof Error)) {
        return;
    }

    const message = error.message.toLowerCase();
    const isConnectivityFailure =
        message.includes("pool timeout") ||
        message.includes("failed to retrieve a connection") ||
        message.includes("can't reach database server") ||
        message.includes("connect") ||
        message.includes("connection") ||
        message.includes("timeout");

    if (isConnectivityFailure) {
        databaseUnavailableUntil = Date.now() + DATABASE_RETRY_COOLDOWN_MS;
    }
}