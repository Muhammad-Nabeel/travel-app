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

function defaultPricingSettings(): SitePricingSettings {
    return {
        serviceChargePercent: 0,
        enableWise: true,
        enableStripe: true,
        enablePaypal: true,
        enableSumup: true,
        enablePaymob: true,
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
        enableWise: parsed.enableWise ?? true,
        enableStripe: parsed.enableStripe ?? true,
        enablePaypal: parsed.enablePaypal ?? true,
        enableSumup: parsed.enableSumup ?? true,
        enablePaymob: parsed.enablePaymob ?? true,
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
