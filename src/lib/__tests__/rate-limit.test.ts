import { clientIp, createRateLimiter, findRateLimitRule } from "@/lib/rate-limit";

const rule = { id: "test", limit: 2, windowMs: 1000 };

describe("rate limiter", () => {
    it("allows up to the limit, then blocks until the window resets", () => {
        const hit = createRateLimiter();
        expect(hit(rule, "1.1.1.1", 0).ok).toBe(true);
        expect(hit(rule, "1.1.1.1", 10).ok).toBe(true);
        expect(hit(rule, "1.1.1.1", 20)).toEqual({ ok: false, retryAfterSeconds: 1 });
        expect(hit(rule, "1.1.1.1", 1000).ok).toBe(true);
    });

    it("counts each client separately", () => {
        const hit = createRateLimiter();
        hit(rule, "a", 0);
        hit(rule, "a", 0);
        expect(hit(rule, "b", 0).ok).toBe(true);
    });

    it("matches the protected endpoints", () => {
        expect(findRateLimitRule("POST", "/api/auth/callback/credentials")?.id).toBe("sign-in");
        expect(findRateLimitRule("POST", "/api/bookings/flight-request")?.id).toBe("lead");
        expect(findRateLimitRule("GET", "/flights")?.id).toBe("flight-search");
        expect(findRateLimitRule("GET", "/api/reviews")).toBeNull();
    });

    it("reads the first forwarded IP", () => {
        const headers = new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" });
        expect(clientIp(headers)).toBe("9.9.9.9");
    });
});
