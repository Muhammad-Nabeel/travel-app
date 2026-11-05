import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { revalidatePublicSite } from "@/lib/revalidate-site";

/** Body: { ids: string[] } in the new display order. */
export async function PUT(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const body = (await request.json()) as { ids?: unknown };
        const ids = Array.isArray(body.ids)
            ? body.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
            : [];

        if (ids.length === 0) {
            return NextResponse.json({ ok: false, error: "ids are required." }, { status: 400 });
        }

        await prisma.$transaction(
            ids.map((id, index) =>
                prisma.airlinePartner.update({ where: { id }, data: { sortOrder: index + 1 } }),
            ),
        );

        revalidatePublicSite();
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to reorder airline partners." }, { status: 500 });
    }
}
