import { useCallback, useEffect, useState } from "react";

export type CurrencySettings = {
    currencySelectorEnabled: boolean;
    defaultCurrency: string;
    availableCurrencies: string[];
};

const DEFAULT_SETTINGS: CurrencySettings = {
    currencySelectorEnabled: true,
    defaultCurrency: "PKR",
    availableCurrencies: ["PKR", "USD", "EUR", "GBP", "SAR", "AED", "JPY"],
};

type LoadResult = { settings: CurrencySettings; error: string | null };

async function fetchSettings(): Promise<LoadResult> {
    try {
        const res = await fetch("/api/admin/settings/currency");
        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.error ?? "Failed to load currency settings");
        }

        return { settings: json.settings || DEFAULT_SETTINGS, error: null };
    } catch (err) {
        return {
            settings: DEFAULT_SETTINGS,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

export function useCurrencySettings() {
    const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const apply = useCallback((result: LoadResult) => {
        if (!result.error) setSettings(result.settings);
        setError(result.error);
        setLoading(false);
    }, []);

    useEffect(() => {
        let ignore = false;
        void fetchSettings().then((result) => {
            if (!ignore) apply(result);
        });
        return () => {
            ignore = true;
        };
    }, [apply]);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        apply(await fetchSettings());
    }, [apply]);

    return {
        settings,
        loading,
        error,
        refetch,
    };
}
