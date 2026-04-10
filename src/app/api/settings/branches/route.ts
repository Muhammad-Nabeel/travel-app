import { NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

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
