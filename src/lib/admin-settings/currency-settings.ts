import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type CurrencySettings = {
    currencySelectorEnabled: boolean;
    defaultCurrency: string;
    availableCurrencies: string[];
};

const CURRENCY_SETTINGS_KEY = "currency_settings";

export function defaultCurrencySettings(): CurrencySettings {
    return {
        currencySelectorEnabled: true,
        defaultCurrency: "PKR",
        availableCurrencies: ["PKR", "USD", "EUR", "GBP", "SAR", "AED", "JPY"],
    };
}

function sanitizeCurrencySettings(value: unknown): CurrencySettings {
    if (!value || typeof value !== "object") {
        return defaultCurrencySettings();
    }

    const settings = value as Partial<CurrencySettings>;

    return {
        currencySelectorEnabled: typeof settings.currencySelectorEnabled === "boolean"
            ? settings.currencySelectorEnabled
            : true,
        defaultCurrency: typeof settings.defaultCurrency === "string"
            ? settings.defaultCurrency
            : "PKR",
        availableCurrencies: Array.isArray(settings.availableCurrencies)
            ? settings.availableCurrencies.filter(currency => typeof currency === "string")
            : ["PKR", "USD", "EUR", "GBP", "SAR", "AED", "JPY"],
    };
}

export async function getStoredCurrencySettings(): Promise<CurrencySettings> {
    if (shouldBypassDatabase()) {
        return defaultCurrencySettings();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: CURRENCY_SETTINGS_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaultCurrencySettings();
        }

        return sanitizeCurrencySettings(row.value);
    } catch (error) {
        markDatabaseUnavailable();
        return defaultCurrencySettings();
    }
}

export async function saveStoredCurrencySettings(settings: CurrencySettings): Promise<void> {
    if (shouldBypassDatabase()) {
        return;
    }

    try {
        await prisma.adminSetting.upsert({
            where: { key: CURRENCY_SETTINGS_KEY },
            update: { value: settings },
            create: { key: CURRENCY_SETTINGS_KEY, value: settings },
        });
    } catch (error) {
        markDatabaseUnavailable();
        throw error;
    }
}