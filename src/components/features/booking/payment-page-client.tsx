"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lock, User } from "lucide-react";

import { BookingFlightSummary } from "@/components/features/booking/booking-flight-summary";
import {
  PaymentGatewayCard,
  type Gateway,
} from "@/components/features/booking/payment-gateway-card";
import type { BookingPayload } from "@/lib/flights/booking-types";

// ── Gateway registry ──────────────────────────────────────────────────────────
// To add a new gateway: append an entry here. No other files need changing.

const GATEWAYS: Gateway[] = [
  {
    id: "wise",
    name: "Wise",
    tagline: "Bank transfers in 40+ currencies. Transparent, low fees.",
    badgeColor: "bg-[#9FE870]",
    badgeLabel: "Wise",
    badgeTextColor: "text-[#163300]",
    tag: "Low fees",
  },
  {
    id: "stripe",
    name: "Stripe",
    tagline: "Credit & debit cards worldwide. Instant processing.",
    badgeColor: "bg-[#635BFF]",
    badgeLabel: "Stripe",
    badgeTextColor: "text-white",
    tag: "Recommended",
  },
  {
    id: "paypal",
    name: "PayPal",
    tagline: "Pay with your PayPal balance, card, or Pay Later.",
    badgeColor: "bg-[#003087]",
    badgeLabel: "PayPal",
    badgeTextColor: "text-white",
  },
  {
    id: "sumup",
    name: "SumUp",
    tagline: "Fast card payments via SumUp Checkout.",
    badgeColor: "bg-[#1A1A2E]",
    badgeLabel: "Sum",
    badgeTextColor: "text-white",
  },
  {
    id: "paymob",
    name: "Paymob",
    tagline: "Cards, mobile wallets & cash across MENA.",
    badgeColor: "bg-[#0088CC]",
    badgeLabel: "Pay",
    badgeTextColor: "text-white",
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const PASSENGER_LABEL: Record<string, string> = {
  adult: "Adult",
  child: "Child",
  infant: "Infant",
};

// ── component ─────────────────────────────────────────────────────────────────

export function PaymentPageClient() {
  const router = useRouter();
  const [payload, setPayload] = useState<BookingPayload | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("booking_payload");
    if (!raw) {
      router.replace("/flights");
      return;
    }
    try {
      setPayload(JSON.parse(raw) as BookingPayload);
    } catch {
      router.replace("/flights");
    }
  }, [router]);

  if (!payload) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  const isRoundTrip = payload.query.tripType === "round-trip";
  const totalPassengers = payload.passengers.length;
  const selected = GATEWAYS.find((g) => g.id === selectedGateway);

  function handlePayNow() {
    // TODO: integrate each gateway's SDK / redirect
    // The full `payload` object is available here and is database-ready.
    alert(
      `Gateway "${selected?.name}" integration coming soon.\n\nBooking payload is assembled and ready to save.`,
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px] lg:items-start">
      {/* ── Left column ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to passenger details
        </button>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Select Payment Method
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your booking will be confirmed once payment is processed. All
            transactions are secured and encrypted.
          </p>
        </div>

        {/* Passenger snapshot */}
        <div className="rounded-2xl border border-base-200 bg-base-100 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Passengers ({totalPassengers})
          </p>
          <div className="flex flex-col gap-2">
            {payload.passengers.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-3.5 text-primary" />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {p.firstName || "—"} {p.lastName || "—"}
                </span>
                <span className="rounded-full bg-base-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {PASSENGER_LABEL[p.type] ?? p.type}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-base-200 pt-3">
            <p className="text-xs text-muted">
              <span className="font-medium text-foreground">Contact: </span>
              {payload.contact.phone}
              {payload.contact.email ? ` · ${payload.contact.email}` : ""}
            </p>
          </div>
        </div>

        {/* Gateway selection */}
        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">
            Payment Gateways
          </p>
          <div
            className="flex flex-col gap-3"
            role="radiogroup"
            aria-label="Payment method"
          >
            {GATEWAYS.map((gw) => (
              <PaymentGatewayCard
                key={gw.id}
                gateway={gw}
                selected={selectedGateway === gw.id}
                onSelect={() => setSelectedGateway(gw.id)}
              />
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-2 rounded-xl bg-base-200/50 px-4 py-3 text-xs text-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Your payment information is encrypted with TLS 1.3 and never stored
            on our servers. You will be redirected to the selected gateway to
            complete the transaction.
          </span>
        </div>
      </div>

      {/* ── Right column: summary sidebar ───────────────────────────────── */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-24">
        {/* Flight summary card */}
        <BookingFlightSummary offer={payload.offer} isRoundTrip={isRoundTrip} />

        {/* Price breakdown + Pay button */}
        <div className="rounded-2xl border border-base-200 bg-base-100 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Price Breakdown
          </p>

          {/* Per-type rows */}
          {(["adult", "child", "infant"] as const).map((type) => {
            const count = payload.passengers.filter(
              (p) => p.type === type,
            ).length;
            if (!count) return null;
            return (
              <div
                key={type}
                className="flex items-center justify-between py-1 text-sm"
              >
                <span className="text-muted">
                  {PASSENGER_LABEL[type]} × {count}
                </span>
                <span className="font-medium text-foreground">
                  {formatMoney(
                    payload.offer.price / totalPassengers,
                    payload.offer.currency,
                  )}
                </span>
              </div>
            );
          })}

          <div className="my-3 border-t border-base-200" />

          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">
              {formatMoney(payload.offer.price, payload.offer.currency)}
            </span>
          </div>
          <p className="mt-0.5 text-right text-[11px] text-muted">
            All taxes &amp; fees included
          </p>

          {/* CTA */}
          <button
            type="button"
            disabled={!selectedGateway}
            onClick={handlePayNow}
            className="btn btn-primary mt-5 w-full rounded-xl py-3 text-base shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selected ? `Pay with ${selected.name}` : "Select a payment method"}
          </button>

          {!selectedGateway && (
            <p className="mt-2 text-center text-[11px] text-muted">
              Please choose a payment gateway above to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
