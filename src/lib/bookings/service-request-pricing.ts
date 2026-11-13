import { prisma } from "@/lib/db";
import type { ServiceRequestType } from "@/lib/service-requests";
import { toPackageRow } from "@/lib/umrah-packages";
import {
    DURATIONS,
    MAX_ADULTS,
    MAX_CHILDREN,
    priceForConfig,
    toStarRating,
} from "@/lib/umrah-pricing";

/**
 * The estimate saved on an enquiry is recomputed from the package in the
 * database, the same way the package page computes it, so the figure staff
 * see can't be edited in the browser. Types without a catalogue price
 * (hotel, visa, flight enquiries) carry no amount.
 */
export type ServiceRequestPrice =
    | { ok: true; amount: number | null; currency: string | null }
    | { ok: false; error: string };

const MAX_TRAVELLERS = 50;

function toCount(value: unknown, min: number, max = MAX_TRAVELLERS): number | null {
    const n = Number(value);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Only the stay lengths the package page offers (7, 14, 21 or 28 nights). */
function toUmrahNights(value: unknown): number | null {
    const n = Number(value);
    return (DURATIONS as readonly number[]).includes(n) ? n : null;
}

export async function priceServiceRequest(
    type: ServiceRequestType,
    payload: Record<string, unknown>,
): Promise<ServiceRequestPrice> {
    if (type === "UMRAH") {
        const packageId = typeof payload.packageId === "string" ? payload.packageId : "";
        // Same limits as the package page, so a hand-made request can't save an
        // estimate for a trip the site never offers.
        const adults = toCount(payload.adults, 1, MAX_ADULTS);
        const childCount = toCount(payload.childCount ?? 0, 0, MAX_CHILDREN);
        const nights = toUmrahNights(payload.nights);
        if (!packageId || adults === null || childCount === null || nights === null) {
            return { ok: false, error: "Please choose your package options again." };
        }

        const row = await prisma.umrahPackage.findFirst({
            where: { id: packageId, status: "PUBLISHED" },
        });
        if (!row) {
            return { ok: false, error: "This package is no longer available." };
        }

        const pkg = toPackageRow(row);
        const pricing = priceForConfig(
            pkg,
            nights,
            adults,
            childCount,
            toStarRating(payload.makkahStars),
            toStarRating(payload.madinahStars),
        );
        return { ok: true, amount: pricing?.allPaxTotal ?? null, currency: pkg.currency };
    }

    if (type === "TOUR") {
        const packageId = typeof payload.packageId === "string" ? payload.packageId : "";
        const travelers = toCount(payload.travelers, 1);
        if (!packageId || travelers === null) {
            return { ok: false, error: "Please check the number of travellers." };
        }

        const pkg = await prisma.tourPackage.findFirst({
            where: { id: packageId, isActive: true },
            select: { pricePerAdult: true, currency: true },
        });
        if (!pkg) {
            return { ok: false, error: "This tour is no longer available." };
        }

        return {
            ok: true,
            amount: Number(pkg.pricePerAdult) * travelers,
            currency: pkg.currency,
        };
    }

    return { ok: true, amount: null, currency: null };
}
