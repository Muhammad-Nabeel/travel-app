import { NextRequest, NextResponse } from "next/server";

import {
    findVisaSeoIssue,
    getStoredVisaCountries,
    saveStoredVisaCountries,
    type VisaCountryEntry,
} from "@/lib/admin-settings/visa-settings";

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
        const seoIssue = findVisaSeoIssue(entries);
        if (seoIssue) {
            return NextResponse.json({ ok: false, error: seoIssue }, { status: 400 });
        }
        const saved = await saveStoredVisaCountries(entries);
        return NextResponse.json(saved, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
