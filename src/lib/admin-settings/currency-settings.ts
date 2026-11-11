import { isSupportedCurrency, SUPPORTED_CURRENCIES } from "@/lib/currencies";
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
        availableCurrencies: [...SUPPORTED_CURRENCIES],
    };
}

/**
 * Keeps only supported, de-duplicated codes and guarantees the default
 * currency is one of the available ones.
 */
export function sanitizeCurrencySettings(value: unknown): CurrencySettings {
    if (!value || typeof value !== "object") {
        return defaultCurrencySettings();
    }

    const settings = value as Partial<Record<keyof CurrencySettings, unknown>>;
    const defaults = defaultCurrencySettings();

    const available = Array.isArray(settings.availableCurrencies)
        ? SUPPORTED_CURRENCIES.filter((code) =>
            (settings.availableCurrencies as unknown[]).includes(code),
        )
        : defaults.availableCurrencies;
    const availableCurrencies = available.length > 0 ? [...available] : defaults.availableCurrencies;

    const defaultCurrency = isSupportedCurrency(settings.defaultCurrency)
        && availableCurrencies.includes(settings.defaultCurrency)
        ? settings.defaultCurrency
        : availableCurrencies[0];

    return {
        currencySelectorEnabled: typeof settings.currencySelectorEnabled === "boolean"
            ? settings.currencySelectorEnabled
            : defaults.currencySelectorEnabled,
        defaultCurrency,
        availableCurrencies,
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

        return sanitizeCurrencySettings(JSON.parse(row.value));
    } catch (error) {
        markDatabaseUnavailable(error);
        return defaultCurrencySettings();
    }
}

export async function saveStoredCurrencySettings(settings: unknown): Promise<CurrencySettings> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving currency settings.");
    }

    const sanitized = sanitizeCurrencySettings(settings);
    const value = JSON.stringify(sanitized);

    try {
        await prisma.adminSetting.upsert({
            where: { key: CURRENCY_SETTINGS_KEY },
            update: { value },
            create: { key: CURRENCY_SETTINGS_KEY, value },
        });
        return sanitized;
    } catch (error) {
        markDatabaseUnavailable(error);
        throw error;
    }
}
