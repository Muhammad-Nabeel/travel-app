import { Prisma } from "@prisma/client";
import { after, NextRequest, NextResponse } from "next/server";

import {
    isPaymentMethodEnabled,
    loadSitePricingSettingsForBooking,
} from "@/lib/admin-settings/site-pricing-settings";
import { resolveBookingUserId } from "@/lib/bookings/link-user";
import type { BookingPayload } from "@/lib/flights/booking-types";
import { rejectWithoutCaptcha } from "@/lib/captcha/verify-captcha";
import { verifyOffer } from "@/lib/flights/offer-signature";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";
import { sendBookingRequestEmails } from "@/lib/email/booking-emails";
import { calculateBookingPricing } from "@/lib/pricing/booking-pricing";

const BRANCHES_KEY = "branches_catalog";

type FlightBookingRequestBody = {
    payload?: BookingPayload;
    paymentMethod?: "cash_on_delivery" | "pay_at_branch" | string;
    selectedBranchId?: string;
    captchaToken?: string | null;
};

const OFFER_REJECTED_MESSAGE: Record<"unsigned" | "tampered" | "expired", string> = {
    unsigned: "This fare could not be verified. Please search again and reselect your flight.",
    tampered: "This fare could not be verified. Please search again and reselect your flight.",
    expired: "This fare has expired. Please search again to get the latest price.",
};

/** The passenger list must match the mix the fare was priced for. */
function passengersMatchQuery(payload: BookingPayload) {
    const passengers = Array.isArray(payload.passengers) ? payload.passengers : [];
    const count = (type: string) => passengers.filter((p) => p?.type === type).length;
    return (
        passengers.length > 0 &&
        count("adult") === payload.query.adults &&
        count("child") === payload.query.children &&
        count("infant") === payload.query.infants &&
        passengers.length === payload.query.adults + payload.query.children + payload.query.infants
    );
}

function buildCustomerName(payload: BookingPayload) {
    const firstPassenger = payload.passengers?.[0];
    const first = firstPassenger?.firstName?.trim() ?? "";
    const last = firstPassenger?.lastName?.trim() ?? "";
    const full = `${first} ${last}`.trim();
    return full || "Guest Customer";
}

function getBranchDelegate() {
    return prisma.branch;
}

async function findLegacyBranchById(id: string) {
    const row = await prisma.adminSetting.findUnique({
        where: { key: BRANCHES_KEY },
        select: { value: true },
    });

    if (!row?.value) return null;

    try {
        const parsed = JSON.parse(row.value) as Array<{
            id?: string;
            name?: string;
            city?: string;
            address?: string;
            phone?: string | null;
            isActive?: boolean;
        }>;

        const matched = parsed.find((item) => item?.id === id && item?.isActive !== false);
        if (!matched) return null;

        return {
            id: String(matched.id ?? ""),
            name: String(matched.name ?? ""),
            city: String(matched.city ?? ""),
            address: String(matched.address ?? ""),
            phone: matched.phone ? String(matched.phone) : null,
        };
    } catch {
        return null;
    }
}

async function generateUniqueReference() {
    for (let i = 0; i < 10; i += 1) {
        const candidate = `FL-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
        const existing = await prisma.booking.findUnique({
            where: { reference: candidate },
            select: { id: true },
        });

        if (!existing) {
            return candidate;
        }
    }

    return `FL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function POST(request: NextRequest) {
    if (shouldBypassDatabase()) {
        return NextResponse.json(
            {
                ok: false,
                error: "Booking service is temporarily unavailable.",
            },
            { status: 503 },
        );
    }

    try {
        const body = (await request.json()) as FlightBookingRequestBody;

        const captchaRejection = await rejectWithoutCaptcha(request, body.captchaToken);
        if (captchaRejection) return captchaRejection;

        // Service charge and payment switches come from the admin settings in
        // the database, never from the request.
        const pricingSettings = await loadSitePricingSettingsForBooking();
        const paymentMethod = body.paymentMethod ?? "";

        if (!isPaymentMethodEnabled(pricingSettings, paymentMethod)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "This payment method is not available. Please choose another.",
                },
                { status: 400 },
            );
        }

        const payload = body.payload;
        if (!payload?.offer || !payload.contact || !payload.query) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Invalid booking payload.",
                },
                { status: 400 },
            );
        }

        // The offer came back from the browser: only its signed contents are trusted.
        const verification = verifyOffer(payload.offer, payload.query);
        if (!verification.ok) {
            return NextResponse.json(
                { ok: false, error: OFFER_REJECTED_MESSAGE[verification.reason] },
                { status: 409 },
            );
        }

        if (!passengersMatchQuery(payload)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Passenger details don't match the fare you selected. Please search again.",
                },
                { status: 400 },
            );
        }

        const pricing = calculateBookingPricing(payload.offer.price, {
            serviceChargePercent: pricingSettings.serviceChargePercent,
        });

        const trimmedEmail = payload.contact.email?.trim().toLowerCase();
        const contactEmail =
            trimmedEmail && trimmedEmail.includes("@") ? trimmedEmail : null;
        const userId = await resolveBookingUserId();

        let selectedBranch:
            | {
                id: string;
                name: string;
                city: string;
                address: string;
                phone: string | null;
            }
            | null = null;

        if (paymentMethod === "pay_at_branch") {
            if (!body.selectedBranchId) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Please select a branch for Pay at Branch.",
                    },
                    { status: 400 },
                );
            }

            const branch = getBranchDelegate();
            selectedBranch = branch
                ? await branch.findFirst({
                    where: {
                        id: body.selectedBranchId,
                        isActive: true,
                    },
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        address: true,
                        phone: true,
                    },
                })
                : await findLegacyBranchById(body.selectedBranchId);

            if (!selectedBranch) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Selected branch is not available.",
                    },
                    { status: 400 },
                );
            }
        }

        const reference = await generateUniqueReference();

        const created = await prisma.booking.create({
            data: {
                reference,
                type: "FLIGHT",
                channel: "CHECKOUT",
                status: "OPEN",
                userId,
                customerName: buildCustomerName(payload),
                customerEmail: contactEmail,
                customerPhone: payload.contact.phone?.trim() || null,
                provider: "INTERNAL",
                totalAmount: new Prisma.Decimal(pricing.grandTotal),
                currency: payload.offer.currency,
                payload: {
                    offer: payload.offer,
                    query: payload.query,
                    passengers: payload.passengers,
                    contact: payload.contact,
                },
                paymentData: {
                    method: paymentMethod,
                    status: "REQUESTED",
                    baseFare: pricing.baseTotal,
                    serviceChargePercent: pricingSettings.serviceChargePercent,
                    serviceChargeAmount: pricing.serviceChargeAmount,
                    grandTotal: pricing.grandTotal,
                    branch: selectedBranch,
                    requestedAt: new Date().toISOString(),
                },
            },
            select: {
                id: true,
                reference: true,
            },
        });

        const customerName = buildCustomerName(payload);
        const route =
            payload.query.tripType === "multi-city"
                ? (payload.query.legs ?? []).map((leg) => `${leg.origin}→${leg.destination}`).join(", ")
                : `${payload.offer.origin} → ${payload.offer.destination}`;
        after(() =>
            sendBookingRequestEmails({
                bookingId: created.id,
                isGuest: userId === null,
                reference: created.reference,
                kind: "Flight booking request",
                customerName,
                customerEmail: contactEmail,
                customerPhone: payload.contact.phone?.trim() || null,
                summary: [
                    ["Route", route],
                    ["Departure", payload.query.departureDate],
                    ...(payload.query.returnDate
                        ? ([["Return", payload.query.returnDate]] as Array<[string, string]>)
                        : []),
                    ["Airline", payload.offer.airline],
                    ["Passengers", String(payload.passengers.length)],
                    [
                        "Payment",
                        paymentMethod === "pay_at_branch"
                            ? `Pay at branch${selectedBranch ? ` (${selectedBranch.name})` : ""}`
                            : "Cash on delivery",
                    ],
                ],
                total: { amount: pricing.grandTotal, currency: payload.offer.currency },
            }),
        );

        return NextResponse.json(
            {
                ok: true,
                bookingId: created.id,
                reference: created.reference,
            },
            { status: 201 },
        );
    } catch (error) {
        markDatabaseUnavailable(error);
        // Internal errors (e.g. Prisma messages with file paths) stay in the server log.
        console.error("[flight-request] Failed to create booking:", error);

        return NextResponse.json(
            {
                ok: false,
                error: "We couldn't create your booking right now. Please try again or contact us.",
            },
            { status: 500 },
        );
    }
}
