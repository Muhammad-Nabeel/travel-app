import { decryptString, encryptString } from "@/lib/admin-settings/encryption";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

export type SmtpSettings = {
    host: string;
    port: number;
    /** true = SSL/TLS from the start (usually port 465); false = STARTTLS (usually port 587). */
    secure: boolean;
    username: string;
    password: string;
    fromName: string;
    fromEmail: string;
};

const ADMIN_SETTINGS_KEY = "smtp";

export const SMTP_REQUIRED_FIELDS = [
    "host",
    "port",
    "username",
    "password",
    "fromName",
    "fromEmail",
] as const satisfies readonly (keyof SmtpSettings)[];

function sanitize(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function sanitizePort(value: unknown): number {
    const port = typeof value === "number" ? value : Number.parseInt(sanitize(value), 10);
    return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 0;
}

function emptySettings(): SmtpSettings {
    return {
        host: "",
        port: 0,
        secure: false,
        username: "",
        password: "",
        fromName: "",
        fromEmail: "",
    };
}

export function normalizeSmtpSettings(input: Partial<Record<keyof SmtpSettings, unknown>>): SmtpSettings {
    return {
        host: sanitize(input.host).toLowerCase(),
        port: sanitizePort(input.port),
        secure: input.secure === true,
        username: sanitize(input.username),
        // Passwords may legitimately contain spaces, so only drop non-strings.
        password: typeof input.password === "string" ? input.password : "",
        fromName: sanitize(input.fromName),
        fromEmail: sanitize(input.fromEmail).toLowerCase(),
    };
}

/** Names of required fields that are still blank. */
export function missingSmtpFields(settings: SmtpSettings): string[] {
    return SMTP_REQUIRED_FIELDS.filter((field) =>
        field === "port" ? settings.port === 0 : settings[field].length === 0,
    );
}

export async function getStoredSmtpSettings(): Promise<SmtpSettings> {
    if (shouldBypassDatabase()) {
        return emptySettings();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: ADMIN_SETTINGS_KEY },
            select: { value: true },
        });

        if (!row) {
            return emptySettings();
        }

        return normalizeSmtpSettings(JSON.parse(decryptString(row.value)) as Partial<SmtpSettings>);
    } catch (err) {
        markDatabaseUnavailable(err);
        return emptySettings();
    }
}

export async function saveStoredSmtpSettings(input: SmtpSettings): Promise<void> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving admin settings.");
    }

    const payload = normalizeSmtpSettings(input);
    const missing = missingSmtpFields(payload);
    if (missing.length > 0) {
        throw new Error(`Fill in all SMTP fields before saving. Missing: ${missing.join(", ")}.`);
    }

    const encryptedValue = encryptString(JSON.stringify(payload));

    await prisma.adminSetting.upsert({
        where: { key: ADMIN_SETTINGS_KEY },
        update: { value: encryptedValue },
        create: { key: ADMIN_SETTINGS_KEY, value: encryptedValue },
    });
}
