import { NextResponse } from "next/server";
import type { Branch } from "@prisma/client";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

const BRANCHES_KEY = "branches_catalog";

type PublicBranch = Pick<Branch, "id" | "name" | "city" | "address" | "phone"> & {
    isActive?: boolean;
    sortOrder?: number;
};

async function getLegacyBranches() {
    const row = await prisma.adminSetting.findUnique({
        where: { key: BRANCHES_KEY },
        select: { value: true },
    });

    if (!row?.value) return [] as PublicBranch[];

    try {
        const parsed = JSON.parse(row.value) as PublicBranch[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [] as PublicBranch[];
    }
}

export async function GET() {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ branches: [] }, { status: 200 });
    }

    try {
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
                id: true,
                name: true,
                city: true,
                address: true,
                phone: true,
            },
        });

        return NextResponse.json({ branches }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ branches: [] }, { status: 200 });
    }
}
