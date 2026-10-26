import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
    getStoredSeoSettings,
    saveStoredSeoSettings,
} from "@/lib/admin-settings/seo-settings";

export async function GET() {
    try {
        const settings = await getStoredSeoSettings();
        return NextResponse.json(settings, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as unknown;
        const saved = await saveStoredSeoSettings(body);
        // Titles and organization data appear on every public page.
        revalidatePath("/", "layout");
        return NextResponse.json(saved, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
