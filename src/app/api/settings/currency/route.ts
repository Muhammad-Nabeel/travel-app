import { NextResponse } from "next/server";

import { getStoredCurrencySettings } from "@/lib/admin-settings/currency-settings";

// Public read-only view of the admin currency settings; the admin route is auth-guarded.
export async function GET() {
    const settings = await getStoredCurrencySettings();
    return NextResponse.json({ settings }, { status: 200 });
}
