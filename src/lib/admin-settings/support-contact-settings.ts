import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type SupportContactSettings = {
    mobileNumber: string;
    landlineNumber: string;
};

type StoredSupportContactSettings = Partial<SupportContactSettings>;

const SUPPORT_CONTACT_KEY = "support_contact";

function sanitizePhone(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function defaultSupportContactSettings(): SupportContactSettings {
    return {
        mobileNumber: "",
        landlineNumber: "",
    };
}

export async function getStoredSupportContactSettings(): Promise<SupportContactSettings> {
    if (shouldBypassDatabase()) {
        return defaultSupportContactSettings();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: SUPPORT_CONTACT_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaultSupportContactSettings();
        }

        const parsed = JSON.parse(row.value) as StoredSupportContactSettings;

        return {
            mobileNumber: sanitizePhone(parsed.mobileNumber),
            landlineNumber: sanitizePhone(parsed.landlineNumber),
        };
    } catch (err) {
        markDatabaseUnavailable(err);
        return defaultSupportContactSettings();
    }
}

export async function saveStoredSupportContactSettings(
    input: SupportContactSettings,
): Promise<SupportContactSettings> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving support contact settings.");
    }

    const payload: SupportContactSettings = {
        mobileNumber: sanitizePhone(input.mobileNumber),
        landlineNumber: sanitizePhone(input.landlineNumber),
    };

    await prisma.adminSetting.upsert({
        where: { key: SUPPORT_CONTACT_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: SUPPORT_CONTACT_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}