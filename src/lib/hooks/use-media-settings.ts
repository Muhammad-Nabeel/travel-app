import { useState, useEffect } from "react";

export type MediaSettings = {
    websiteLogo: string | null;
    airlineLogos: string[];
    blogMedia: string[];
};

export function useMediaSettings() {
    const [settings, setSettings] = useState<MediaSettings>({
        websiteLogo: null,
        airlineLogos: [],
        blogMedia: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/settings/media");
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error ?? "Failed to load media settings");
            }

            setSettings(json.settings || {
                websiteLogo: null,
                airlineLogos: [],
                blogMedia: [],
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