import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type AirlineLogoEntry = {
    id: string;
    name: string;
    src: string;
    storagePath: string | null;
    isActive: boolean;
    sortOrder: number;
};

const AIRLINE_LOGOS_KEY = "airline_logos";

export function defaultAirlineLogos(): AirlineLogoEntry[] {
    return [
        { id: "ek", name: "Emirates", src: "/airlines/ek.gif", storagePath: null, isActive: true, sortOrder: 1 },
        { id: "qr", name: "Qatar Airways", src: "/airlines/qr.gif", storagePath: null, isActive: true, sortOrder: 2 },
        { id: "ey", name: "Etihad Airways", src: "/airlines/ey.gif", storagePath: null, isActive: true, sortOrder: 3 },
        { id: "tk", name: "Turkish Airlines", src: "/airlines/tk.gif", storagePath: null, isActive: true, sortOrder: 4 },
        { id: "ba", name: "British Airways", src: "/airlines/ba.gif", storagePath: null, isActive: true, sortOrder: 5 },
        { id: "sv", name: "Saudi", src: "/airlines/sv.gif", storagePath: null, isActive: true, sortOrder: 6 },
        { id: "g9", name: "Air Arabia", src: "/airlines/Air-Arabia-Logo.jpg", storagePath: null, isActive: true, sortOrder: 7 },
        { id: "fz", name: "Flydubai", src: "/airlines/fz.png", storagePath: null, isActive: true, sortOrder: 8 },
        { id: "pk", name: "PIA", src: "/airlines/pk.png", storagePath: null, isActive: true, sortOrder: 9 },
        { id: "pa", name: "Airblue", src: "/airlines/Airblue_Logo.png", storagePath: null, isActive: true, sortOrder: 10 },
        { id: "er", name: "Serene Air", src: "/airlines/serene-logo.jpg", storagePath: null, isActive: true, sortOrder: 11 },
        { id: "ku", name: "Kuwait Airways", src: "/airlines/ku.gif", storagePath: null, isActive: true, sortOrder: 12 },
    ];
}

function sanitizeLogoEntry(value: unknown, index: number): AirlineLogoEntry | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Partial<AirlineLogoEntry>;

    const id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : `logo-${index + 1}`;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const src = typeof row.src === "string" ? row.src.trim() : "";

    if (!name || !src) return null;

    return {
        id,
        name,
        src,
        storagePath:
            typeof row.storagePath === "string" && row.storagePath.trim()
                ? row.storagePath.trim()
                : null,
        isActive: row.isActive !== false,
        sortOrder: Number.isFinite(Number(row.sortOrder)) ? Number(row.sortOrder) : index + 1,
    };
}

function sanitizeAirlineLogos(value: unknown): AirlineLogoEntry[] {
    if (!Array.isArray(value)) {
        return defaultAirlineLogos();
    }

    const cleaned = value
        .map((item, index) => sanitizeLogoEntry(item, index))
        .filter((item): item is AirlineLogoEntry => item !== null)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    return cleaned.length > 0 ? cleaned : defaultAirlineLogos();
}

export async function getStoredAirlineLogos(): Promise<AirlineLogoEntry[]> {
    if (shouldBypassDatabase()) {
        return defaultAirlineLogos();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: AIRLINE_LOGOS_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaultAirlineLogos();
        }

        const parsed = JSON.parse(row.value) as unknown;
        return sanitizeAirlineLogos(parsed);
    } catch (error) {
        markDatabaseUnavailable(error);
        return defaultAirlineLogos();
    }
}

export async function saveStoredAirlineLogos(input: AirlineLogoEntry[]) {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving airline logos.");
    }

    const payload = sanitizeAirlineLogos(input);

    await prisma.adminSetting.upsert({
        where: { key: AIRLINE_LOGOS_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: AIRLINE_LOGOS_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}
