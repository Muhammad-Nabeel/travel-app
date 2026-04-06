import { NextRequest, NextResponse } from "next/server";

import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { packageSchema } from "@/lib/validations/package";
import { DUMMY_PACKAGES, type PackageRow } from "../route";

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;

    if (shouldBypassDatabase()) {
        const pkg = DUMMY_PACKAGES.find((p) => p.id === id || p.slug === id);
        if (!pkg) {
            return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
        }
        return NextResponse.json(pkg);
    }

    try {
        const pkg = await prisma.umrahPackage.findFirst({
            where: { OR: [{ id }, { slug: id }] },
        });
        if (!pkg) {
            return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
        }
        const row: PackageRow = {
            id: pkg.id,
            slug: pkg.slug,
            title: pkg.title,
            subtitle: pkg.subtitle,
            description: pkg.description,
            makkahNights: pkg.makkahNights,
            madinahNights: pkg.madinahNights,
            departureCity: pkg.departureCity,
            airlineNotes: pkg.airlineNotes,
            hotelSummary: pkg.hotelSummary,
            inclusions: pkg.inclusions as string[],
            exclusions: pkg.exclusions as string[],
            basePrice: Number(pkg.basePrice),
            currency: pkg.currency,
            seatsAvailable: pkg.seatsAvailable,
            startDate: pkg.startDate.toISOString(),
            endDate: pkg.endDate.toISOString(),
            status: pkg.status as PackageRow["status"],
            createdAt: pkg.createdAt.toISOString(),
            updatedAt: pkg.updatedAt.toISOString(),
        };
        return NextResponse.json(row);
    } catch (err) {
        markDatabaseUnavailable(err);
        if (err instanceof Error) {
            return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
        }
        return NextResponse.json({ ok: false, error: "Fetch failed" }, { status: 503 });
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const data = packageSchema.parse(body);

        const pkg = await prisma.umrahPackage.update({
            where: { id },
            data: {
                title: data.title,
                subtitle: data.subtitle ?? null,
                description: data.description,
                makkahNights: data.makkahNights,
                madinahNights: data.madinahNights,
                departureCity: data.departureCity,
                airlineNotes: data.airlineNotes ?? null,
                hotelSummary: data.hotelSummary ?? null,
                inclusions: data.inclusions,
                exclusions: data.exclusions,
                basePrice: data.basePrice,
                currency: data.currency,
                seatsAvailable: data.seatsAvailable,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                status: data.status,
            },
        });

        return NextResponse.json(pkg);
    } catch (err: unknown) {
        if (err && typeof err === "object" && "issues" in err) {
            const issues = (err as { issues: Array<{ path: string[]; message: string }> }).issues;
            const message = issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
            return NextResponse.json({ ok: false, error: `Validation: ${message}` }, { status: 400 });
        }
        if (err instanceof Error) {
            return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
        }
        return NextResponse.json({ ok: false, error: "Update failed" }, { status: 503 });
    }
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        await prisma.umrahPackage.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
        }
        return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 503 });
    }
}
