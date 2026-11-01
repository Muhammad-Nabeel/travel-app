import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

// Single source for the business contact details shown on the contact page,
// footer, arrange-a-call page and organization structured data.
export type SupportContactSettings = {
    email: string;
    mobileNumber: string;
    landlineNumber: string;
    whatsappNumber: string;
    address: string;
};

type StoredSupportContactSettings = Partial<SupportContactSettings>;

const SUPPORT_CONTACT_KEY = "support_contact";
const DEFAULT_SUPPORT_EMAIL = "support@easytrip.com.pk";

function sanitizeText(value: unknown, maxLength = 200): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
}

function sanitizeEmail(value: unknown): string {
    const email = sanitizeText(value, 150).toLowerCase();
    return email.includes("@") ? email : "";
}

function defaultSupportContactSettings(): SupportContactSettings {
    return {
        email: DEFAULT_SUPPORT_EMAIL,
        mobileNumber: "",
        landlineNumber: "",
        whatsappNumber: "",
        address: "",
    };
}

export function getPrimaryPhone(settings: SupportContactSettings): string {
    return settings.mobileNumber || settings.landlineNumber;
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
            email: sanitizeEmail(parsed.email) || DEFAULT_SUPPORT_EMAIL,
            mobileNumber: sanitizeText(parsed.mobileNumber, 40),
            landlineNumber: sanitizeText(parsed.landlineNumber, 40),
            whatsappNumber: sanitizeText(parsed.whatsappNumber, 40),
            address: sanitizeText(parsed.address, 300),
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

    const email = sanitizeText(input.email, 150);
    if (email && !sanitizeEmail(email)) {
        throw new Error("Enter a valid support email address.");
    }

    const payload: SupportContactSettings = {
        email: sanitizeEmail(email) || DEFAULT_SUPPORT_EMAIL,
        mobileNumber: sanitizeText(input.mobileNumber, 40),
        landlineNumber: sanitizeText(input.landlineNumber, 40),
        whatsappNumber: sanitizeText(input.whatsappNumber, 40),
        address: sanitizeText(input.address, 300),
    };

    await prisma.adminSetting.upsert({
        where: { key: SUPPORT_CONTACT_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: SUPPORT_CONTACT_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}
