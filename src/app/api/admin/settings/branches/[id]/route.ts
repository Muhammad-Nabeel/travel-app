import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

const BRANCHES_KEY = "branches_catalog";

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

function getBranchDelegate() {
    return (prisma as unknown as {
        branch?: {
            update: (args: unknown) => Promise<any>;
            delete: (args: unknown) => Promise<any>;
        };
    }).branch;
}

async function getLegacyBranches() {
    const row = await prisma.adminSetting.findUnique({
        where: { key: BRANCHES_KEY },
        select: { value: true },
    });

    if (!row?.value) return [] as any[];

    try {
        const parsed = JSON.parse(row.value) as any[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [] as any[];
    }
}

async function saveLegacyBranches(branches: any[]) {
    await prisma.adminSetting.upsert({
        where: { key: BRANCHES_KEY },
        update: { value: JSON.stringify(branches) },
        create: { key: BRANCHES_KEY, value: JSON.stringify(branches) },
    });
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

        const branch = getBranchDelegate();
        const updated = branch
            ? await branch.update({
                where: { id },
                data: payload,
            })
            : (() => {
                const existing = { id };
                return {
                    ...existing,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                };
            })();

        if (!branch) {
            const legacy = await getLegacyBranches();
            const next = legacy.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        ...payload,
                        updatedAt: new Date().toISOString(),
                    }
                    : item,
            );
            await saveLegacyBranches(next);
        }

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
        const branch = getBranchDelegate();
        if (branch) {
            await branch.delete({ where: { id } });
        } else {
            const legacy = await getLegacyBranches();
            await saveLegacyBranches(legacy.filter((item) => item.id !== id));
        }
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to delete branch." }, { status: 500 });
    }
}
