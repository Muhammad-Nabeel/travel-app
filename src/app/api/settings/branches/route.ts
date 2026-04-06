import { NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

const BRANCHES_KEY = "branches_catalog";

function getBranchDelegate() {
    return (prisma as unknown as {
        branch?: {
            findMany: (args?: unknown) => Promise<any[]>;
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

export async function GET() {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ branches: [] }, { status: 200 });
    }

    try {
        const branch = getBranchDelegate();
        const branches = branch
            ? await branch.findMany({
                where: { isActive: true },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                select: {
                    id: true,
                    name: true,
                    city: true,
                    address: true,
                    phone: true,
                },
            })
            : (await getLegacyBranches())
                .filter((item) => item?.isActive !== false)
                .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
                .map((item) => ({
                    id: String(item.id ?? ""),
                    name: String(item.name ?? ""),
                    city: String(item.city ?? ""),
                    address: String(item.address ?? ""),
                    phone: item.phone ? String(item.phone) : null,
                }));

        return NextResponse.json({ branches }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ branches: [] }, { status: 200 });
    }
}
