import { createHash } from "node:crypto";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { createRateLimiter, type RateLimitResult, type RateLimitRule } from "@/lib/rate-limit";

/**
 * Rate limits shared by every app process, kept in Postgres
 * ("RateLimitBucket"). One atomic statement increments the counter, or
 * restarts it once the window has passed, using the database clock so all
 * processes agree on when a window ends.
 *
 * If the database can't be reached the in-memory limiter takes over for
 * that process, so a database outage never blocks real visitors but abuse
 * is still slowed.
 */

const fallback = createRateLimiter();

/** Expired rows are swept on roughly 1 in 100 hits. */
const SWEEP_PROBABILITY = 0.01;

/** Client IPs are stored hashed, never in the clear. */
function bucketKey(rule: RateLimitRule, clientKey: string) {
    const hashed = createHash("sha256").update(clientKey).digest("base64url").slice(0, 32);
    return `${rule.id}:${hashed}`;
}

function sweepExpired() {
    prisma
        .$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 hour'`
        .catch((error: unknown) => console.error("[rate-limit] Sweep failed:", error));
}

export async function hitRateLimit(rule: RateLimitRule, clientKey: string): Promise<RateLimitResult> {
    // While the database is known to be down, don't make every visitor wait
    // for a connection timeout before falling back.
    if (shouldBypassDatabase()) return fallback(rule, clientKey);

    const key = bucketKey(rule, clientKey);

    try {
        // "resetAt" is a UTC timestamp without time zone, like every Prisma DateTime.
        const rows = await prisma.$queryRaw<Array<{ count: number; retryAfterMs: number }>>`
            INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
            VALUES (${key}, 1, (NOW() AT TIME ZONE 'UTC') + ${rule.windowMs} * INTERVAL '1 millisecond')
            ON CONFLICT ("key") DO UPDATE SET
                "count" = CASE
                    WHEN "RateLimitBucket"."resetAt" <= (NOW() AT TIME ZONE 'UTC') THEN 1
                    ELSE "RateLimitBucket"."count" + 1
                END,
                "resetAt" = CASE
                    WHEN "RateLimitBucket"."resetAt" <= (NOW() AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt"
                    ELSE "RateLimitBucket"."resetAt"
                END
            RETURNING
                "count",
                (EXTRACT(EPOCH FROM ("resetAt" - (NOW() AT TIME ZONE 'UTC'))) * 1000)::float8 AS "retryAfterMs"`;

        if (Math.random() < SWEEP_PROBABILITY) sweepExpired();

        const row = rows[0];
        if (!row) return fallback(rule, clientKey);

        const count = Number(row.count);
        if (count > rule.limit) {
            return {
                ok: false,
                retryAfterSeconds: Math.max(1, Math.ceil(Number(row.retryAfterMs) / 1000)),
            };
        }
        return { ok: true, remaining: rule.limit - count };
    } catch (error) {
        console.error("[rate-limit] Database limiter unavailable, using in-memory limits:", error);
        markDatabaseUnavailable(error);
        return fallback(rule, clientKey);
    }
}
