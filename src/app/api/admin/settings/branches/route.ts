import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

type BranchInput = {
    name?: string;
    city?: string;
    address?: string;
    phone?: string | null;
    isActive?: boolean;
    sortOrder?: number;
};

function normalizeBranchInput(body: BranchInput) {
    return {
        name: String(body.name ?? "").trim(),
        city: String(body.city ?? "").trim(),
        address: String(body.address ?? "").trim(),
        phone: body.phone ? String(body.phone).trim() : null,
        isActive: Boolean(body.isActive ?? true),
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    };
}

export async function GET() {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ branches: [] }, { status: 200 });
    }

    try {
        const branches = await prisma.branch.findMany({
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });

        return NextResponse.json({ branches }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to fetch branches." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const body = (await request.json()) as BranchInput;
        const payload = normalizeBranchInput(body);

        if (!payload.name || !payload.city || !payload.address) {
            return NextResponse.json(
                { ok: false, error: "Name, city, and address are required." },
                { status: 400 },
            );
        }

        const created = await prisma.branch.create({
            data: payload,
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to create branch." }, { status: 500 });
    }
}
