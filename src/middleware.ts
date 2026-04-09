import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLE = "ADMIN";

export async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const isAdminPage = pathname.startsWith("/admin");
    const isAdminApi = pathname.startsWith("/api/admin");
    const isUserDashboard = pathname.startsWith("/dashboard");

    if (!isAdminPage && !isAdminApi && !isUserDashboard) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const role = typeof token?.role === "string" ? token.role : null;

    if (!token) {
        if (isAdminApi) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const signInUrl = new URL("/signin", req.url);
        signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
        return NextResponse.redirect(signInUrl);
    }

    if (isUserDashboard) {
        return NextResponse.next();
    }

    if (role !== ADMIN_ROLE) {
        if (isAdminApi) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*", "/dashboard/:path*"],
};
