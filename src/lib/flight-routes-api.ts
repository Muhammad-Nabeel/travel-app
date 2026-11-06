import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { markDatabaseUnavailable } from "@/lib/db";

/** Shared error mapping for the /api/admin/flight-routes handlers. */
export function flightRouteErrorResponse(error: unknown, fallback: string) {
    if (error instanceof ZodError) {
        return NextResponse.json(
            { ok: false, error: error.issues[0]?.message ?? "Invalid flight route." },
            { status: 400 },
        );
    }
    if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
    ) {
        return NextResponse.json(
            { ok: false, error: "A page for this route already exists." },
            { status: 409 },
        );
    }
    markDatabaseUnavailable(error);
    return NextResponse.json({ ok: false, error: fallback }, { status: 500 });
}
