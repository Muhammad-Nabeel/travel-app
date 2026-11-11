import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

import { getAuthOptions } from "@/lib/providers/auth/auth-provider";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

// Options are resolved per request so enabling or disabling Google sign-in in
// the admin panel takes effect without a restart.
async function handler(req: NextRequest, context: RouteContext) {
    return NextAuth(req, context, await getAuthOptions());
}

export { handler as GET, handler as POST };
