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
            findMany: (args?: unknown) => Promise<any[]>;
            create: (args: unknown) => Promise<any>;
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

export async function GET() {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ branches: [] }, { status: 200 });
    }

    try {
        const branch = getBranchDelegate();
        const branches = branch
            ? await branch.findMany({
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            })
            : await getLegacyBranches();

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

        const branch = getBranchDelegate();
        const created = branch
            ? await branch.create({
                data: payload,
            })
            : (() => {
                const legacy = {
                    id: `legacy-${Date.now()}`,
                    ...payload,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                return legacy;
            })();

        if (!branch) {
            const existing = await getLegacyBranches();
            await saveLegacyBranches([...existing, created]);
        }

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to create branch." }, { status: 500 });
    }
}
