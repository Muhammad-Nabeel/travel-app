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

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const { id } = await context.params;
        const body = (await request.json()) as BranchInput;
        const payload = normalizeBranchInput(body);

        if (!payload.name || !payload.city || !payload.address) {
            return NextResponse.json(
                { ok: false, error: "Name, city, and address are required." },
                { status: 400 },
            );
        }

        const updated = await prisma.branch.update({
            where: { id },
            data: payload,
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to update branch." }, { status: 500 });
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
        await prisma.branch.delete({ where: { id } });
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to delete branch." }, { status: 500 });
    }
}
