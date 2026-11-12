/**
 * Rate-limit rules for public endpoints, plus an in-memory fixed-window
 * limiter. The proxy counts in Postgres (lib/rate-limit-store.ts) so every
 * process shares one count; this in-memory limiter is its fallback when the
 * database can't be reached.
 */

export type RateLimitRule = {
    /** Bucket name, so different endpoints don't share a counter. */
    id: string;
    limit: number;
    windowMs: number;
};

export type RateLimitResult =
    | { ok: true; remaining: number }
    | { ok: false; retryAfterSeconds: number };

type Bucket = { count: number; resetAt: number };

const MAX_BUCKETS = 50_000;

export function createRateLimiter() {
    const buckets = new Map<string, Bucket>();

    function sweep(now: number) {
        for (const [key, bucket] of buckets) {
            if (bucket.resetAt <= now) buckets.delete(key);
        }
    }

    return function hit(rule: RateLimitRule, clientKey: string, now = Date.now()): RateLimitResult {
        if (buckets.size > MAX_BUCKETS) sweep(now);

        const key = `${rule.id}:${clientKey}`;
        const bucket = buckets.get(key);

        if (!bucket || bucket.resetAt <= now) {
            buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
            return { ok: true, remaining: rule.limit - 1 };
        }

        if (bucket.count >= rule.limit) {
            return {
                ok: false,
                retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
            };
        }

        bucket.count += 1;
        return { ok: true, remaining: rule.limit - bucket.count };
    };
}

const MINUTE = 60_000;

/**
 * Public endpoints that send email, create leads, cost a Sabre search or
 * accept a password. Matched on method + exact path or path prefix.
 */
const RULES: Array<{
    method: string;
    match: (pathname: string) => boolean;
    rule: RateLimitRule;
}> = [
    {
        method: "POST",
        match: (p) => p === "/api/auth/callback/credentials",
        rule: { id: "sign-in", limit: 10, windowMs: 15 * MINUTE },
    },
    {
        method: "POST",
        match: (p) => p === "/api/auth/register",
        rule: { id: "register", limit: 5, windowMs: 15 * MINUTE },
    },
    {
        method: "POST",
        match: (p) => p === "/api/auth/forgot-password" || p === "/api/auth/resend-verification",
        rule: { id: "forgot-password", limit: 5, windowMs: 15 * MINUTE },
    },
    {
        method: "POST",
        match: (p) => p === "/api/auth/reset-password" || p === "/api/auth/verify-email",
        rule: { id: "auth-token", limit: 10, windowMs: 15 * MINUTE },
    },
    {
        method: "POST",
        match: (p) => p === "/api/contact" || p.startsWith("/api/bookings/"),
        rule: { id: "lead", limit: 10, windowMs: 10 * MINUTE },
    },
    {
        method: "POST",
        match: (p) => p === "/api/reviews",
        rule: { id: "review", limit: 5, windowMs: 60 * MINUTE },
    },
    {
        // Each of these runs a live Sabre search.
        method: "GET",
        match: (p) =>
            p === "/api/search/flights" ||
            p === "/api/search/fare-calendar" ||
            p === "/flights" ||
            p === "/flights/booking",
        rule: { id: "flight-search", limit: 30, windowMs: MINUTE },
    },
];

export function findRateLimitRule(method: string, pathname: string): RateLimitRule | null {
    const entry = RULES.find((r) => r.method === method && r.match(pathname));
    return entry?.rule ?? null;
}

/** Client IP as forwarded by the host's reverse proxy. */
export function clientIp(headers: Headers): string {
    const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
