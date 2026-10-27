import { useCallback, useEffect, useState } from "react";

export type MediaSettings = {
    websiteLogo: string | null;
    airlineLogos: string[];
    blogMedia: string[];
};

const DEFAULT_SETTINGS: MediaSettings = {
    websiteLogo: null,
    airlineLogos: [],
    blogMedia: [],
};

type LoadResult = { settings: MediaSettings; error: string | null };

async function fetchSettings(): Promise<LoadResult> {
    try {
        const res = await fetch("/api/admin/settings/media");
        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.error ?? "Failed to load media settings");
        }

        return { settings: json.settings || DEFAULT_SETTINGS, error: null };
    } catch (err) {
        return {
            settings: DEFAULT_SETTINGS,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

export function useMediaSettings() {
    const [settings, setSettings] = useState<MediaSettings>(DEFAULT_SETTINGS);
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
