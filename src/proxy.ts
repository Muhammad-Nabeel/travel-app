import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ROLE = "ADMIN";

export default withAuth(
    function proxy(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;
        const role = typeof token?.role === "string" ? token.role : null;

        const isAdminApi = pathname.startsWith("/api/admin");
        const isAdminPage = pathname.startsWith("/admin");

        // API routes need JSON error responses instead of redirects.
        // The authorized callback always returns true for /api/admin so the
        // request reaches here even when unauthenticated.
        if (isAdminApi) {
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
            // Pass API admin routes through unconditionally so the middleware
            // function above can return the correct JSON error instead of a redirect.
            // All other protected routes require a valid JWT.
            authorized: ({ token, req }) =>
                req.nextUrl.pathname.startsWith("/api/admin") ? true : !!token,
        },
        pages: {
            signIn: "/signin",
        },
    },
);

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*", "/dashboard/:path*"],
};
