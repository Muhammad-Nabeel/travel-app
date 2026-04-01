import { prisma, shouldBypassDatabase } from "@/lib/db";

export type SitePricingSettings = {
    serviceChargePercent: number;
};

const SITE_PRICING_KEY = "site_pricing";

function defaultPricingSettings(): SitePricingSettings {
    return {
        serviceChargePercent: 0,
    };
}

function toPercent(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return Math.min(100, Math.max(0, Number(parsed.toFixed(2))));
}

export async function getStoredSitePricingSettings(): Promise<SitePricingSettings> {
    if (shouldBypassDatabase()) {
        return defaultPricingSettings();
    }

    try {
        const row = await prisma.adminSetting.findUnique({
            where: { key: SITE_PRICING_KEY },
            select: { value: true },
        });

        if (!row?.value) {
            return defaultPricingSettings();
        }

        const parsed = JSON.parse(row.value) as Partial<SitePricingSettings>;

        return {
            serviceChargePercent: toPercent(parsed.serviceChargePercent),
        };
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
    };

    await prisma.adminSetting.upsert({
        where: { key: SITE_PRICING_KEY },
        update: { value: JSON.stringify(payload) },
        create: { key: SITE_PRICING_KEY, value: JSON.stringify(payload) },
    });

    return payload;
}
