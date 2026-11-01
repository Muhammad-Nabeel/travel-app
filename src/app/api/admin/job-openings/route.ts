import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import {
    missingJobOpeningFields,
    normalizeJobOpeningInput,
    type JobOpeningInput,
} from "@/lib/job-openings";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export async function GET() {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const jobOpenings = await prisma.jobOpening.findMany({
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        });

        return NextResponse.json({ jobOpenings }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to fetch job openings." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const payload = normalizeJobOpeningInput((await request.json()) as JobOpeningInput);
        const missing = missingJobOpeningFields(payload);

        if (missing.length > 0) {
            return NextResponse.json(
                { ok: false, error: `${missing.join(", ")} required.` },
                { status: 400 },
            );
        }

        const created = await prisma.jobOpening.create({ data: payload });

        revalidatePublicSite();
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to create job opening." }, { status: 500 });
    }
}
