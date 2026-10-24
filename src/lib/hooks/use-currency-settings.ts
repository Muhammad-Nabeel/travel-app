import { useState, useEffect } from "react";

export type CurrencySettings = {
    currencySelectorEnabled: boolean;
    defaultCurrency: string;
    availableCurrencies: string[];
};

export function useCurrencySettings() {
    const [settings, setSettings] = useState<CurrencySettings>({
        currencySelectorEnabled: true,
        defaultCurrency: "PKR",
        availableCurrencies: ["PKR", "USD", "EUR", "GBP", "SAR", "AED", "JPY"],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/settings/currency");
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error ?? "Failed to load currency settings");
            }

            setSettings(json.settings || {
                currencySelectorEnabled: true,
                defaultCurrency: "PKR",
                availableCurrencies: ["PKR", "USD", "EUR", "GBP", "SAR", "AED", "JPY"],
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return {
        settings,
        loading,
        error,
        refetch: loadSettings,
    };
}