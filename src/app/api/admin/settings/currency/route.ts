import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getStoredCurrencySettings, saveStoredCurrencySettings } from "@/lib/admin-settings/currency-settings";

export async function GET() {
    const settings = await getStoredCurrencySettings();
    return NextResponse.json({ settings }, { status: 200 });
}

export async function POST(request: NextRequest) {
    try {
        const settings = await saveStoredCurrencySettings(await request.json());
        revalidatePath("/", "layout");
        // Route handlers aren't under the root layout; the public copy is cached separately.
        revalidatePath("/api/settings/currency");

        return NextResponse.json({ ok: true, settings }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Failed to save currency settings.",
            },
            { status: 500 },
        );
    }
}
