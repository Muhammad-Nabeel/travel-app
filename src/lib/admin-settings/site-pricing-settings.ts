import { prisma, shouldBypassDatabase } from "@/lib/db";

export type SitePricingSettings = {
    serviceChargePercent: number;
    enableWise: boolean;
    enableStripe: boolean;
    enablePaypal: boolean;
    enableSumup: boolean;
    enablePaymob: boolean;
    enableCashOnDelivery: boolean;
    enablePayAtBranch: boolean;
};

const SITE_PRICING_KEY = "site_pricing";

/**
 * Payment methods that actually complete a booking today. Online gateways
 * stay switched off and hidden from checkout until each one is integrated
 * end to end (server-created payment, webhook confirmation).
 */
export const IMPLEMENTED_PAYMENT_METHODS = ["cash_on_delivery", "pay_at_branch"] as const;
export type ImplementedPaymentMethod = (typeof IMPLEMENTED_PAYMENT_METHODS)[number];

export function defaultPricingSettings(): SitePricingSettings {
    return {
        serviceChargePercent: 0,
        enableWise: false,
        enableStripe: false,
        enablePaypal: false,
        enableSumup: false,
        enablePaymob: false,
        enableCashOnDelivery: true,
        enablePayAtBranch: true,
    };
}

function toPercent(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return Math.min(100, Math.max(0, Number(parsed.toFixed(2))));
}

async function readSitePricingSettings(): Promise<SitePricingSettings | null> {
    const row = await prisma.adminSetting.findUnique({
        where: { key: SITE_PRICING_KEY },
        select: { value: true },
    });

    if (!row?.value) {
        return null;
    }

    const parsed = JSON.parse(row.value) as Partial<SitePricingSettings>;

    return {
        serviceChargePercent: toPercent(parsed.serviceChargePercent),
        enableWise: parsed.enableWise ?? false,
        enableStripe: parsed.enableStripe ?? false,
        enablePaypal: parsed.enablePaypal ?? false,
        enableSumup: parsed.enableSumup ?? false,
        enablePaymob: parsed.enablePaymob ?? false,
        enableCashOnDelivery: parsed.enableCashOnDelivery ?? true,
        enablePayAtBranch: parsed.enablePayAtBranch ?? true,
    };
}

async function writeSitePricingSettings(payload: SitePricingSettings) {
    await prisma.adminSetting.upsert({
        where: { key: SITE_PRICING_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: SITE_PRICING_KEY, value: JSON.stringify(payload) },
    });
}

export async function getStoredSitePricingSettings(): Promise<SitePricingSettings> {
    if (shouldBypassDatabase()) {
        return defaultPricingSettings();
    }

    try {
        return (await readSitePricingSettings()) ?? defaultPricingSettings();
    } catch {
        return defaultPricingSettings();
    }
}

/**
 * For pricing a booking: unlike getStoredSitePricingSettings it never falls
 * back to defaults on a database error, so a booking is never priced with a
 * 0% service charge just because the settings could not be read.
 */
export async function loadSitePricingSettingsForBooking(): Promise<SitePricingSettings> {
    return (await readSitePricingSettings()) ?? defaultPricingSettings();
}

export function isPaymentMethodEnabled(
    settings: SitePricingSettings,
    method: string,
): method is ImplementedPaymentMethod {
    if (method === "cash_on_delivery") return settings.enableCashOnDelivery;
    if (method === "pay_at_branch") return settings.enablePayAtBranch;
    return false;
}

export async function saveStoredSitePricingSettings(
    input: SitePricingSettings,
): Promise<SitePricingSettings> {
    if (shouldBypassDatabase()) {
        throw new Error("Database is not available for saving pricing settings.");
    }

    const payload: SitePricingSettings = {
        serviceChargePercent: toPercent(input.serviceChargePercent),
        enableWise: Boolean(input.enableWise),
        enableStripe: Boolean(input.enableStripe),
        enablePaypal: Boolean(input.enablePaypal),
        enableSumup: Boolean(input.enableSumup),
        enablePaymob: Boolean(input.enablePaymob),
        enableCashOnDelivery: Boolean(input.enableCashOnDelivery),
        enablePayAtBranch: Boolean(input.enablePayAtBranch),
    };

    await writeSitePricingSettings(payload);

    return payload;
}
