import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ROLE = "ADMIN";

// Public content APIs: anyone can read published items, only admins can change them.
const ADMIN_CONTENT_APIS = [
    "/api/packages",
    "/api/destinations",
    "/api/activities",
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

export default withAuth(
    function proxy(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;
        const role = typeof token?.role === "string" ? token.role : null;

        const isApi = pathname.startsWith("/api/");
        const isAdminPage = pathname.startsWith("/admin");

        // API routes need JSON error responses instead of redirects.
        // The authorized callback always returns true for /api so the
        // request reaches here even when unauthenticated.
        if (isApi) {
            if (!requiresAdmin(req)) {
                return NextResponse.next();
            }
            if (!token) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (role !== ADMIN_ROLE) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            return NextResponse.next();
        }

        // Non-admin logged-in users trying to reach /admin → send to dashboard
        if (isAdminPage && role !== ADMIN_ROLE) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // Pass API routes through unconditionally so the proxy function
            // above can return the correct JSON error instead of a redirect.
            // All other protected routes require a valid JWT.
            authorized: ({ token, req }) =>
                req.nextUrl.pathname.startsWith("/api/") ? true : !!token,
        },
        pages: {
            signIn: "/signin",
        },
    },
);

export const config = {
    matcher: [
        "/admin/:path*",
        "/api/admin/:path*",
        "/dashboard/:path*",
        "/api/packages/:path*",
        "/api/destinations/:path*",
        "/api/activities/:path*",
        "/api/blog/:path*",
        "/api/reviews/:path*",
    ],
};
