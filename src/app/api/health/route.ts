import { NextResponse } from "next/server";

import { isDatabaseConfigured, prisma } from "@/lib/db";

// Uptime monitors call this: 200 only when the app can reach its database.
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3_000;

async function checkDatabase(): Promise<"ok" | "unconfigured" | "unreachable"> {
    if (!isDatabaseConfigured()) return "unconfigured";
    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Database health check timed out")), DB_TIMEOUT_MS),
            ),
        ]);
        return "ok";
    } catch (error) {
        console.error("[health] Database check failed:", error);
        return "unreachable";
    }
}

export async function GET() {
    const database = await checkDatabase();
    const ok = database === "ok";

    return NextResponse.json(
        {
            ok,
            service: "travel-app",
            database,
            timestamp: new Date().toISOString(),
        },
        { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
}
