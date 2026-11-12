import { connection } from "next/server";

import { isConnectivityError } from "../../prisma/connectivity";

export { createPrismaClient, prisma } from "../../prisma/client";
export { isConnectivityError } from "../../prisma/connectivity";

// Short: reads already retry once, so the breaker only opens after two
// failures in a row, and admin pages shouldn't say "unavailable" for long.
const DATABASE_RETRY_COOLDOWN_MS = 15_000;

let databaseUnavailableUntil = 0;

export function isDatabaseConfigured() {
    return Boolean(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
}

/**
 * Pages are cached for 5 minutes (ISR). A page rendered while the database is
 * unreachable has empty sections, and must not replace the good cached copy.
 * connection() marks the current render as per-request: during a background
 * refresh Next then fails the refresh and keeps serving the last good page;
 * during a normal per-request render (and in dev) it does nothing, so the
 * page still degrades to empty sections instead of an error.
 */
function keepOutageOutOfCache() {
    try {
        void connection().catch(() => {});
    } catch {
        // Static render: already recorded as not cacheable. Outside a request
        // (scripts, tests, after() callbacks, the proxy) there is nothing to protect.
    }
}

export function shouldBypassDatabase() {
    if (!isDatabaseConfigured()) {
        return true;
    }

    if (Date.now() < databaseUnavailableUntil) {
        keepOutageOutOfCache();
        return true;
    }
    return false;
}

/** One short line naming the real cause; Prisma's own log cuts the reason off. */
function describeDatabaseError(error: unknown): string {
    const codes: string[] = [];
    let message = "";
    for (let current: unknown = error, depth = 0; current && depth < 5; depth += 1) {
        if (typeof current !== "object") break;
        const e = current as { code?: unknown; message?: unknown; cause?: unknown };
        if (typeof e.code === "string" && !codes.includes(e.code)) codes.push(e.code);
        // Prisma's message is mostly a code excerpt; the driver's cause says what happened.
        if (typeof e.message === "string" && !e.message.includes("invocation")) {
            message = e.message.split("\n")[0].trim().slice(0, 200);
        }
        current = e.cause;
    }
    return [codes.join("/"), message].filter(Boolean).join(": ") || "unknown error";
}

export function markDatabaseUnavailable(error: unknown) {
    if (!isConnectivityError(error)) return;

    const wasOpen = Date.now() < databaseUnavailableUntil;
    databaseUnavailableUntil = Date.now() + DATABASE_RETRY_COOLDOWN_MS;
    keepOutageOutOfCache();

    if (!wasOpen) {
        console.error(
            `[db] Database unreachable (${describeDatabaseError(error)}). ` +
                `Database-backed sections show empty for ${DATABASE_RETRY_COOLDOWN_MS / 1000}s, then retry.`,
        );
    }
}
