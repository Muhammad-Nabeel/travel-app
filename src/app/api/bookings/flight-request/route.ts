import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import type { BookingPayload } from "@/lib/flights/booking-types";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

const BRANCHES_KEY = "branches_catalog";

type FlightBookingRequestBody = {
    payload?: BookingPayload;
    paymentMethod?: "cash_on_delivery" | "pay_at_branch" | string;
    selectedBranchId?: string;
    pricing?: {
        serviceChargePercent?: number;
        serviceChargeAmount?: number;
        grandTotal?: number;
    };
};

function toNumber(value: unknown, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

        if (
            body.paymentMethod !== "cash_on_delivery" &&
            body.paymentMethod !== "pay_at_branch"
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Unsupported payment method for booking request.",
                },
                { status: 400 },
            );
        }

        const payload = body.payload;
        if (!payload?.offer || !payload.contact) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Invalid booking payload.",
                },
                { status: 400 },
            );
        }

        const trimmedEmail = payload.contact.email?.trim();
        const contactEmail =
            trimmedEmail && trimmedEmail.includes("@") ? trimmedEmail : null;
        const user = contactEmail
            ? await prisma.user.findUnique({
                where: { email: contactEmail },
                select: { id: true },
            })
            : null;

        let selectedBranch:
            | {
                id: string;
                name: string;
                city: string;
                address: string;
                phone: string | null;
            }
            | null = null;

        if (body.paymentMethod === "pay_at_branch") {
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
        const totalAmount = toNumber(
            body.pricing?.grandTotal,
            toNumber(payload.offer.price, 0),
        );

        const created = await prisma.booking.create({
            data: {
                reference,
                type: "FLIGHT",
                channel: "CHECKOUT",
                status: "PENDING",
                userId: user?.id ?? null,
                customerName: buildCustomerName(payload),
                customerEmail: contactEmail,
                customerPhone: payload.contact.phone?.trim() || null,
                provider: "INTERNAL",
                totalAmount: new Prisma.Decimal(totalAmount),
                currency: payload.offer.currency || "PKR",
                payload: {
                    offer: payload.offer,
                    query: payload.query,
                    passengers: payload.passengers,
                    contact: payload.contact,
                },
                paymentData: {
                    method: body.paymentMethod,
                    status: "REQUESTED",
                    serviceChargePercent: toNumber(body.pricing?.serviceChargePercent, 0),
                    serviceChargeAmount: toNumber(body.pricing?.serviceChargeAmount, 0),
                    grandTotal: totalAmount,
                    branch: selectedBranch,
                    requestedAt: new Date().toISOString(),
                },
            },
            select: {
                id: true,
                reference: true,
            },
        });

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

        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Failed to create booking request.",
            },
            { status: 500 },
        );
    }
}
