import { useCallback, useEffect, useState } from "react";

import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

export type CurrencySettings = {
    currencySelectorEnabled: boolean;
    defaultCurrency: string;
    availableCurrencies: string[];
};

const DEFAULT_SETTINGS: CurrencySettings = {
    currencySelectorEnabled: true,
    defaultCurrency: "PKR",
    availableCurrencies: [...SUPPORTED_CURRENCIES],
};

type LoadResult = { settings: CurrencySettings; error: string | null };

async function fetchSettings(): Promise<LoadResult> {
    try {
        const res = await fetch("/api/settings/currency", { cache: "no-store" });
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

// The navbar, currency selector and flight search box all use this hook, so
// they share one request per page load. A failed load is dropped so the next
// component to mount tries again.
let sharedLoad: Promise<LoadResult> | null = null;

function loadShared(): Promise<LoadResult> {
    sharedLoad ??= fetchSettings().then((result) => {
        if (result.error) sharedLoad = null;
        return result;
    });
    return sharedLoad;
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
        void loadShared().then((result) => {
            if (!ignore) apply(result);
        });
        return () => {
            ignore = true;
        };
    }, [apply]);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        sharedLoad = null;
        apply(await loadShared());
    }, [apply]);

    return {
        settings,
        loading,
        error,
        refetch,
    };
}
