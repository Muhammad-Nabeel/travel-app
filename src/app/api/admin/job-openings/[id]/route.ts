import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import {
    missingJobOpeningFields,
    normalizeJobOpeningInput,
    type JobOpeningInput,
} from "@/lib/job-openings";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const { id } = await context.params;
        const payload = normalizeJobOpeningInput((await request.json()) as JobOpeningInput);
        const missing = missingJobOpeningFields(payload);

        if (missing.length > 0) {
            return NextResponse.json(
                { ok: false, error: `${missing.join(", ")} required.` },
                { status: 400 },
            );
        }

        const updated = await prisma.jobOpening.update({
            where: { id },
            data: payload,
        });

        revalidatePublicSite();
        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to update job opening." }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const { id } = await context.params;
        await prisma.jobOpening.delete({ where: { id } });

        revalidatePublicSite();
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to delete job opening." }, { status: 500 });
    }
}
