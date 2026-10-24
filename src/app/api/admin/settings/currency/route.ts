import { NextRequest, NextResponse } from "next/server";
import { getStoredCurrencySettings, saveStoredCurrencySettings } from "@/lib/admin-settings/currency-settings";

export async function GET() {
    const settings = await getStoredCurrencySettings();
    return NextResponse.json({ settings }, { status: 200 });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { currencySelectorEnabled, defaultCurrency, availableCurrencies } = body;

        const settings = {
            currencySelectorEnabled: typeof currencySelectorEnabled === "boolean" ? currencySelectorEnabled : true,
            defaultCurrency: typeof defaultCurrency === "string" ? defaultCurrency : "PKR",
            availableCurrencies: Array.isArray(availableCurrencies) ? availableCurrencies : ["PKR", "USD", "EUR", "GBP", "SAR", "AED"],
        };

        await saveStoredCurrencySettings(settings);

        return NextResponse.json({
            ok: true,
            settings,
        }, { status: 200 });
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