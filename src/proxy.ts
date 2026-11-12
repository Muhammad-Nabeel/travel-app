import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { getCurrentRole } from "@/lib/auth/current-role";
import { clientIp, findRateLimitRule } from "@/lib/rate-limit";
import { hitRateLimit } from "@/lib/rate-limit-store";

const ADMIN_ROLE = "ADMIN";

// Public content APIs: anyone can read published items, only admins can change them.
const ADMIN_CONTENT_APIS = [
    "/api/packages",
    "/api/destinations",
    "/api/activities",
    "/api/tour-packages",
    "/api/blog",
    "/api/reviews",
];

function isContentApi(pathname: string) {
    return ADMIN_CONTENT_APIS.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

function requiresAdmin(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

    if (pathname.startsWith("/api/admin")) {
        return true;
    }

    if (!isContentApi(pathname)) {
        return false;
    }

    // Visitors submit reviews from the site widget; the route itself keeps them unpublished.
    if (pathname === "/api/reviews" && req.method === "POST") {
        return false;
    }

    if (req.method === "GET" || req.method === "HEAD") {
        // `?all=true` includes drafts and unpublished items.
        return searchParams.get("all") === "true";
    }

    return true;
}

function isSignedInArea(pathname: string) {
    return (
        pathname === "/admin" ||
        pathname.startsWith("/admin/") ||
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/")
    );
}

/** A 429 response when the client is over its limit, otherwise the requests it has left. */
async function checkRateLimit(
    req: NextRequest,
): Promise<{ blocked: NextResponse } | { remaining: number | null }> {
    const rule = findRateLimitRule(req.method, req.nextUrl.pathname);
    if (!rule) return { remaining: null };

    const result = await hitRateLimit(rule, clientIp(req.headers));
    if (result.ok) return { remaining: result.remaining };

    const headers = { "Retry-After": String(result.retryAfterSeconds) };
    const message = "Too many requests. Please wait a moment and try again.";
    return {
        blocked: req.nextUrl.pathname.startsWith("/api/")
            ? NextResponse.json({ ok: false, error: message }, { status: 429, headers })
            : new NextResponse(message, { status: 429, headers }),
    };
}

/** Admin access follows the role in the database, not the one frozen in the token at sign-in. */
async function hasAdminRole(userId: unknown) {
    if (typeof userId !== "string" || !userId) return false;
    try {
        return (await getCurrentRole(userId)) === ADMIN_ROLE;
    } catch (error) {
        console.error("[proxy] Role check failed:", error);
        return false;
    }
}

/** Admin and sign-in checks for a request that is within its rate limit. */
async function route(req: NextRequestWithAuth): Promise<NextResponse> {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // API routes need JSON error responses instead of redirects.
    // The authorized callback lets every public request through so the
    // checks here can answer with the right status.
    if (pathname.startsWith("/api/")) {
        if (!requiresAdmin(req)) {
            return NextResponse.next();
        }
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!(await hasAdminRole(token.id))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.next();
    }

    // Non-admin logged-in users trying to reach /admin → send to dashboard
    if (
        (pathname === "/admin" || pathname.startsWith("/admin/")) &&
        !(await hasAdminRole(token?.id))
    ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

const authProxy = withAuth(
    (req: NextRequestWithAuth) => route(req),
    {
        callbacks: {
            // Only the admin panel and the customer dashboard need a session;
            // everything else matched below is here for rate limiting or for
            // the API checks above.
            authorized: ({ token, req }) =>
                isSignedInArea(req.nextUrl.pathname) ? !!token : true,
        },
        pages: {
            signIn: "/signin",
        },
    },
);

/**
 * Rate limits run first: withAuth returns early for its own /api/auth/*
 * routes (sign-in, callbacks) without calling route(), and those are the
 * ones that most need limiting.
 */
export default async function proxy(req: NextRequest, event: NextFetchEvent) {
    const limit = await checkRateLimit(req);
    if ("blocked" in limit) return limit.blocked;

    const response =
        (await authProxy(req as NextRequestWithAuth, event)) ?? NextResponse.next();
    if (limit.remaining !== null) {
        response.headers.set("X-RateLimit-Remaining", String(limit.remaining));
    }
    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/api/admin/:path*",
        "/dashboard/:path*",
        "/api/packages/:path*",
        "/api/destinations/:path*",
        "/api/activities/:path*",
        "/api/tour-packages/:path*",
        "/api/blog/:path*",
        "/api/reviews/:path*",
        // Rate-limited public endpoints (see lib/rate-limit.ts).
        "/api/auth/:path*",
        "/api/contact",
        "/api/bookings/:path*",
        "/api/search/:path*",
        "/flights",
        "/flights/booking",
    ],
};
