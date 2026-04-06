import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type VisaType = "e-visa" | "sticker-visa";

export type VisaCountryEntry = {
    country: string;
    visaType: VisaType;
    duration: string;
    entry: string;
    perPersonCost: string;
    serviceFee: string;
    netCost: string;
    code: string;
    isActive: boolean;
    sortOrder: number;
};

const VISA_COUNTRIES_KEY = "visa_countries";

function sanitizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeVisaType(value: unknown): VisaType {
    return value === "sticker-visa" ? "sticker-visa" : "e-visa";
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        return value.toLowerCase() === "true";
    }
    return fallback;
}

function normalizeNumber(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
}

export function defaultVisaCountries(): VisaCountryEntry[] {
    return [
        {
            country: "Malaysia",
            visaType: "e-visa",
            duration: "30 days",
            entry: "Single Entry",
            perPersonCost: "PKR 30,000 / Traveler",
            serviceFee: "PKR 10,000",
            netCost: "PKR 40,000",
            code: "MY",
            isActive: true,
            sortOrder: 1,
        },
        {
            country: "UAE",
            visaType: "sticker-visa",
            duration: "30 days",
            entry: "Single Entry",
            perPersonCost: "PKR 25,000 / Traveler",
            serviceFee: "PKR 8,000",
            netCost: "PKR 33,000",
            code: "AE",
            isActive: true,
            sortOrder: 2,
        },
    ];
}

function sanitizeVisaCountries(value: unknown): VisaCountryEntry[] {
    if (!Array.isArray(value)) {
        return defaultVisaCountries();
    }

    const items = value
        .map((item) => {
            if (!item || typeof item !== "object") {
                return null;
            }

            const entry = item as Partial<VisaCountryEntry>;
            const country = sanitizeText(entry.country);
            const duration = sanitizeText(entry.duration);
            const visaType = normalizeVisaType(entry.visaType);
            const entryType = sanitizeText(entry.entry);
            const perPersonCost = sanitizeText(entry.perPersonCost);
            const serviceFee = sanitizeText(entry.serviceFee);
            const netCost = sanitizeText(entry.netCost);
            const code = sanitizeText(entry.code);
            const isActive = normalizeBoolean(entry.isActive, true);
            const sortOrder = normalizeNumber(entry.sortOrder, 0);

            if (
                !country ||
                !duration ||
                !entryType ||
                !perPersonCost ||
                !serviceFee ||
                !netCost
            ) {
                return null;
            }

            return {
                country,
                visaType,
                duration,
                entry: entryType,
                perPersonCost,
                serviceFee,
                netCost,
                code,
                isActive,
                sortOrder,
            } satisfies VisaCountryEntry;
        })
        .filter((item): item is VisaCountryEntry => item !== null);

    return items.length > 0 ? items : defaultVisaCountries();
}

export async function getStoredVisaCountries(): Promise<VisaCountryEntry[]> {
    if (shouldBypassDatabase()) {
        return defaultVisaCountries();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: VISA_COUNTRIES_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaultVisaCountries();
        }

        const parsed = JSON.parse(row.value) as unknown;
        return sanitizeVisaCountries(parsed);
    } catch (err) {
        markDatabaseUnavailable(err);
        return defaultVisaCountries();
    }
}

export async function saveStoredVisaCountries(
    input: VisaCountryEntry[],
): Promise<VisaCountryEntry[]> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving visa countries.");
    }

    const payload = sanitizeVisaCountries(input);

    await prisma.adminSetting.upsert({
        where: { key: VISA_COUNTRIES_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: VISA_COUNTRIES_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}
