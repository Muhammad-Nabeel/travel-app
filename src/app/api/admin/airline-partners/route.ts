import { NextRequest, NextResponse } from "next/server";

import { uploadAirlineLogo, validateLogoFile } from "@/lib/airline-partners";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { revalidateContent } from "@/lib/revalidate-site";
import { isR2Configured } from "@/lib/storage/r2";

export async function GET() {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const airlinePartners = await prisma.airlinePartner.findMany({
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });

        return NextResponse.json({ airlinePartners }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to fetch airline partners." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }
    if (!isR2Configured()) {
        return NextResponse.json(
            { ok: false, error: "Cloudflare R2 storage is not configured." },
            { status: 500 },
        );
    }

    try {
        const formData = await request.formData();
        const name = String(formData.get("name") ?? "").trim();
        const file = formData.get("file");

        if (!name) {
            return NextResponse.json({ ok: false, error: "Airline name is required." }, { status: 400 });
        }
        const fileError = validateLogoFile(file);
        if (fileError) {
            return NextResponse.json({ ok: false, error: fileError }, { status: 400 });
        }

        const { logoUrl, storagePath } = await uploadAirlineLogo(file as File, name);
        const last = await prisma.airlinePartner.findFirst({
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true },
        });

        const created = await prisma.airlinePartner.create({
            data: {
                name,
                logoUrl,
                storagePath,
                isActive: formData.get("isActive") !== "false",
                sortOrder: (last?.sortOrder ?? 0) + 1,
            },
        });

        revalidateContent("airlinePartners");
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : "Failed to add airline partner." },
            { status: 500 },
        );
    }
}
