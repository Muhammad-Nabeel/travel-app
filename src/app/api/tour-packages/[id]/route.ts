import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/db";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { toTourPackageRow } from "@/lib/tour-package-data";
import { tourPackageSchema } from "@/lib/validations/tour-package";

// The slug is set once on create: renaming a package must not break the URL
// search engines and customers already have.
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const data = tourPackageSchema.parse(body);

        const pkg = await prisma.tourPackage.update({
            where: { id },
            data,
        });
        revalidatePublicSite();
        return NextResponse.json(toTourPackageRow(pkg), { status: 200 });
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
            { ok: false, error: "Update failed" },
            { status: 503 },
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        await prisma.tourPackage.delete({ where: { id } });
        revalidatePublicSite();
        return NextResponse.json({ ok: true });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json(
                { ok: false, error: err.message },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { ok: false, error: "Delete failed" },
            { status: 503 },
        );
    }
}
