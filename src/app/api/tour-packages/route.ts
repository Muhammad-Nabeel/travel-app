import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { getUniqueTourPackageSlug, toTourPackageRow } from "@/lib/tour-package-data";
import type { TourPackage } from "@/lib/tour-packages";
import { tourPackageSchema } from "@/lib/validations/tour-package";

function jsonWithSource(data: TourPackage[], source: "db" | "offline") {
    return NextResponse.json(data, {
        headers: { "x-tour-package-source": source },
    });
}

export async function GET(request: NextRequest) {
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    if (shouldBypassDatabase()) {
        return jsonWithSource([], "offline");
    }

    try {
        const rows = await prisma.tourPackage.findMany({
            where: showAll ? undefined : { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });

        return jsonWithSource(rows.map(toTourPackageRow), "db");
    } catch (error) {
        markDatabaseUnavailable(error);
        return jsonWithSource([], "offline");
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = tourPackageSchema.parse(body);

        if (shouldBypassDatabase()) {
            return NextResponse.json(
                { ok: false, error: "Database not configured — cannot persist tour packages in demo mode." },
                { status: 503 },
            );
        }

        const pkg = await prisma.tourPackage.create({
            data: {
                ...data,
                slug: await getUniqueTourPackageSlug(data.title),
            },
        });
        revalidatePublicSite();
        return NextResponse.json(toTourPackageRow(pkg), { status: 201 });
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const message = err.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join("; ");
            return NextResponse.json(
                { ok: false, error: `Validation: ${message}` },
                { status: 400 },
            );
        }
        if (err instanceof Error) {
            return NextResponse.json(
                { ok: false, error: err.message },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { ok: false, error: "Create failed" },
            { status: 503 },
        );
    }
}
