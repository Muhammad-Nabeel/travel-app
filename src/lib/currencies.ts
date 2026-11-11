// Currencies the site can display. Safe to import from client components.
export const SUPPORTED_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "SAR", "AED", "JPY"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
    return typeof value === "string" && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
