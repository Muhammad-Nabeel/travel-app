export { prisma } from "../../prisma/client";

const DATABASE_RETRY_COOLDOWN_MS = 30_000;

let databaseUnavailableUntil = 0;

function hasHostConfig() {
    return Boolean(
        process.env.DATABASE_HOST &&
        process.env.DATABASE_USER &&
        process.env.DATABASE_NAME,
    );
}

export function isDatabaseConfigured() {
    return Boolean(process.env.DATABASE_URL) || hasHostConfig();
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