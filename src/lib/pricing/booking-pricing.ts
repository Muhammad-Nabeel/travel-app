export type BookingPricingSettings = {
    serviceChargePercent: number;
};

export type BookingPricingBreakdown = {
    baseTotal: number;
    serviceChargeAmount: number;
    grandTotal: number;
};

function toPercent(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.min(100, Math.max(0, value));
}

function roundCurrency(value: number): number {
    return Math.round(value);
}

export function calculateBookingPricing(
    baseTotal: number,
    settings: BookingPricingSettings,
): BookingPricingBreakdown {
    const normalizedBase = Math.max(0, Number(baseTotal) || 0);
    const serviceChargePercent = toPercent(settings.serviceChargePercent);

    const serviceChargeAmount = roundCurrency(
        (normalizedBase * serviceChargePercent) / 100,
    );

    return {
        baseTotal: roundCurrency(normalizedBase),
        serviceChargeAmount,
        grandTotal: roundCurrency(normalizedBase + serviceChargeAmount),
    };
}