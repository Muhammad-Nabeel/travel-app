import { NextResponse } from "next/server";

import { getStoredCurrencySettings } from "@/lib/admin-settings/currency-settings";

// Every page's navbar fetches this, so it is cached instead of read from the
// database per visit. Admin → Settings → Currency revalidates it on save; the
// daily expiry is only a safety net, like the root layout.
export const revalidate = 86400;

// Public read-only view of the admin currency settings; the admin route is auth-guarded.
export async function GET() {
    const settings = await getStoredCurrencySettings();
    return NextResponse.json({ settings }, { status: 200 });
}
