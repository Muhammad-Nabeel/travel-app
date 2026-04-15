import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type MediaSettings = {
    websiteLogo: string | null;
    airlineLogos: string[];
    blogMedia: string[];
};

const MEDIA_SETTINGS_KEY = "media_settings";

export function defaultMediaSettings(): MediaSettings {
    return {
        websiteLogo: null,
        airlineLogos: [],
        blogMedia: [],
    };
}

function sanitizeMediaSettings(value: unknown): MediaSettings {
    if (!value || typeof value !== "object") {
        return defaultMediaSettings();
    }

    const settings = value as Partial<MediaSettings>;

    return {
        websiteLogo: typeof settings.websiteLogo === "string" ? settings.websiteLogo : null,
        airlineLogos: Array.isArray(settings.airlineLogos)
            ? settings.airlineLogos.filter(url => typeof url === "string")
            : [],
        blogMedia: Array.isArray(settings.blogMedia)
            ? settings.blogMedia.filter(url => typeof url === "string")
            : [],
    };
}

export async function getStoredMediaSettings(): Promise<MediaSettings> {
    if (shouldBypassDatabase()) {
        return defaultMediaSettings();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: MEDIA_SETTINGS_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaultMediaSettings();
        }

        const parsed = JSON.parse(row.value) as unknown;
        return sanitizeMediaSettings(parsed);
    } catch (error) {
        markDatabaseUnavailable(error);
        return defaultMediaSettings();
    }
}

export async function saveStoredMediaSettings(input: Partial<MediaSettings>) {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving media settings.");
    }

    const current = await getStoredMediaSettings();
    const merged = { ...current, ...input };
    const payload = sanitizeMediaSettings(merged);

    await prisma.adminSetting.upsert({
        where: { key: MEDIA_SETTINGS_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: MEDIA_SETTINGS_KEY, value: JSON.stringify(payload) },
    });
}