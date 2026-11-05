import { NextRequest, NextResponse } from "next/server";

import { uploadAirlineLogo, validateLogoFile } from "@/lib/airline-partners";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { deleteFromR2, isR2Configured } from "@/lib/storage/r2";

async function removeStoredLogo(storagePath: string | null) {
    if (!storagePath || !isR2Configured()) return;
    try {
        await deleteFromR2(storagePath);
    } catch (error) {
        // The row change already succeeded; an orphaned object is harmless.
        console.error("[airline-partners] failed to delete R2 object", storagePath, error);
    }
}

/** Multipart update: name, isActive and an optional replacement logo file. */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    if (shouldBypassDatabase()) {
        return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    try {
        const { id } = await context.params;
        const existing = await prisma.airlinePartner.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ ok: false, error: "Airline partner not found." }, { status: 404 });
        }

        const formData = await request.formData();
        const name = String(formData.get("name") ?? "").trim();
        const file = formData.get("file");

        if (!name) {
            return NextResponse.json({ ok: false, error: "Airline name is required." }, { status: 400 });
        }

        let logo: { logoUrl: string; storagePath: string } | null = null;
        if (file instanceof File && file.size > 0) {
            const fileError = validateLogoFile(file);
            if (fileError) {
                return NextResponse.json({ ok: false, error: fileError }, { status: 400 });
            }
            if (!isR2Configured()) {
                return NextResponse.json(
                    { ok: false, error: "Cloudflare R2 storage is not configured." },
                    { status: 500 },
                );
            }
            logo = await uploadAirlineLogo(file, name);
        }

        const updated = await prisma.airlinePartner.update({
            where: { id },
            data: {
                name,
                isActive: formData.get("isActive") !== "false",
                ...(logo ?? {}),
            },
        });

        if (logo) await removeStoredLogo(existing.storagePath);

        revalidatePublicSite();
        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : "Failed to update airline partner." },
            { status: 500 },
        );
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
        const deleted = await prisma.airlinePartner.delete({ where: { id } });
        await removeStoredLogo(deleted.storagePath);

        revalidatePublicSite();
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        markDatabaseUnavailable(error);
        return NextResponse.json({ ok: false, error: "Failed to delete airline partner." }, { status: 500 });
    }
}
