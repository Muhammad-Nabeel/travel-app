import { NextRequest, NextResponse } from "next/server";

import {
    findVisaGuideIssue,
    findVisaSeoIssue,
    getStoredVisaCountries,
    saveStoredVisaCountries,
    type VisaCountryEntry,
} from "@/lib/admin-settings/visa-settings";
import { revalidatePublicSite } from "@/lib/revalidate-site";

export async function GET() {
    try {
        const countries = await getStoredVisaCountries();
        return NextResponse.json(countries, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = (await request.json()) as VisaCountryEntry[];
        const entries = Array.isArray(body) ? body : [];
        const issue = findVisaSeoIssue(entries) ?? findVisaGuideIssue(entries);
        if (issue) {
            return NextResponse.json({ ok: false, error: issue }, { status: 400 });
        }
        const saved = await saveStoredVisaCountries(entries);
        // Visa pages, the /visa listing and the sitemap read these entries.
        revalidatePublicSite();
        return NextResponse.json(saved, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
