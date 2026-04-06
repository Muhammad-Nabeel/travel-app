"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lock, User } from "lucide-react";

import { BookingFlightSummary } from "@/components/features/booking/booking-flight-summary";
import {
  PaymentGatewayCard,
  type Gateway,
} from "@/components/features/booking/payment-gateway-card";
import { trackGa4Event } from "@/lib/analytics/ga4-events";
import type { BookingPayload } from "@/lib/flights/booking-types";
import { calculateBookingPricing } from "@/lib/pricing/booking-pricing";

// ── Gateway registry ──────────────────────────────────────────────────────────
// To add a new gateway: append an entry here. No other files need changing.

const GATEWAYS: Gateway[] = [
  {
    id: "cash_on_delivery",
    name: "Cash on Delivery",
    tagline: "Pay in cash when documents are delivered.",
    badgeColor: "bg-[#065F46]",
    badgeLabel: "COD",
    badgeTextColor: "text-white",
  },
  {
    id: "pay_at_branch",
    name: "Pay at Branch",
    tagline: "Reserve now and pay at your nearest branch office.",
    badgeColor: "bg-[#1D4ED8]",
    badgeLabel: "Branch",
    badgeTextColor: "text-white",
  },
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

type SitePricingResponse = {
  serviceChargePercent?: number;
  enableWise?: boolean;
  enableStripe?: boolean;
  enablePaypal?: boolean;
  enableSumup?: boolean;
  enablePaymob?: boolean;
  enableCashOnDelivery?: boolean;
  enablePayAtBranch?: boolean;
};

type BranchOption = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
};

const DEFAULT_PAYMENT_SWITCHES = {
  enableWise: true,
  enableStripe: true,
  enablePaypal: true,
  enableSumup: true,
  enablePaymob: true,
  enableCashOnDelivery: true,
  enablePayAtBranch: true,
};

const GATEWAY_TOGGLE_KEY: Record<
  string,
  keyof typeof DEFAULT_PAYMENT_SWITCHES
> = {
  wise: "enableWise",
  stripe: "enableStripe",
  paypal: "enablePaypal",
  sumup: "enableSumup",
  paymob: "enablePaymob",
  cash_on_delivery: "enableCashOnDelivery",
  pay_at_branch: "enablePayAtBranch",
};

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
  const [payload] = useState<BookingPayload | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = sessionStorage.getItem("booking_payload");
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as BookingPayload;
    } catch {
      return null;
    }
  });
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [paymentSwitches, setPaymentSwitches] = useState(
    DEFAULT_PAYMENT_SWITCHES,
  );
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (!payload) {
      router.replace("/flights");
    }
  }, [payload, router]);

  useEffect(() => {
    if (!payload) return;

    trackGa4Event("payment_page_viewed", {
      trip_type: payload.query.tripType,
      origin: payload.query.origin,
      destination: payload.query.destination,
      departure_date: payload.query.departureDate,
      return_date: payload.query.returnDate ?? "",
      passenger_count: payload.passengers.length,
      amount: payload.offer.price,
      currency: payload.offer.currency,
    });
  }, [payload]);

  useEffect(() => {
    async function loadPricingSettings() {
      try {
        const res = await fetch("/api/settings/site-pricing", {
          cache: "no-store",
        });
        const json = (await res.json()) as SitePricingResponse;
        setServiceChargePercent(Number(json.serviceChargePercent ?? 0));
        setPaymentSwitches({
          enableWise: json.enableWise ?? true,
          enableStripe: json.enableStripe ?? true,
          enablePaypal: json.enablePaypal ?? true,
          enableSumup: json.enableSumup ?? true,
          enablePaymob: json.enablePaymob ?? true,
          enableCashOnDelivery: json.enableCashOnDelivery ?? true,
          enablePayAtBranch: json.enablePayAtBranch ?? true,
        });
      } catch {
        setServiceChargePercent(0);
        setPaymentSwitches(DEFAULT_PAYMENT_SWITCHES);
      }
    }

    void loadPricingSettings();
  }, []);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch("/api/settings/branches", {
          cache: "no-store",
        });
        const json = (await res.json()) as { branches?: BranchOption[] };
        setBranches(Array.isArray(json.branches) ? json.branches : []);
      } catch {
        setBranches([]);
      }
    }

    void loadBranches();
  }, []);

  const availableGateways = GATEWAYS.filter((gateway) => {
    const toggleKey = GATEWAY_TOGGLE_KEY[gateway.id];
    return toggleKey ? paymentSwitches[toggleKey] : true;
  });

  useEffect(() => {
    if (
      selectedGateway &&
      !availableGateways.some((g) => g.id === selectedGateway)
    ) {
      setSelectedGateway(null);
    }
  }, [availableGateways, selectedGateway]);

  if (!payload) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  const totalPassengers = payload.passengers.length;

  const selected = GATEWAYS.find((g) => g.id === selectedGateway);
  const pricing = calculateBookingPricing(payload.offer.price, {
    serviceChargePercent,
  });

  async function handlePayNow() {
    if (!payload) {
      setPaymentError("Session expired. Please start your booking again.");
      router.replace("/flights");
      return;
    }

    if (!selectedGateway) {
      setPaymentError("Please select a payment method.");
      return;
    }

    if (selectedGateway === "pay_at_branch" && !selectedBranchId) {
      setPaymentError("Please select a branch for Pay at Branch.");
      return;
    }

    setPaymentError("");

    trackGa4Event("payment_submitted", {
      payment_method: selectedGateway,
      trip_type: payload.query.tripType,
      passenger_count: payload.passengers.length,
      amount: pricing.grandTotal,
      currency: payload.offer.currency,
    });

    if (
      selectedGateway === "cash_on_delivery" ||
      selectedGateway === "pay_at_branch"
    ) {
      setSubmittingPayment(true);

      try {
        const res = await fetch("/api/bookings/flight-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethod: selectedGateway,
            selectedBranchId:
              selectedGateway === "pay_at_branch"
                ? selectedBranchId
                : undefined,
            payload,
            pricing: {
              serviceChargePercent,
              serviceChargeAmount: pricing.serviceChargeAmount,
              grandTotal: pricing.grandTotal,
            },
          }),
        });

        const json = (await res.json()) as {
          ok?: boolean;
          reference?: string;
          error?: string;
        };

        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Unable to create booking request.");
        }

        sessionStorage.removeItem("booking_payload");
        alert(
          `Booking request submitted successfully.\nReference: ${json.reference ?? "N/A"}`,
        );
        router.push("/flights");
        return;
      } catch (error) {
        setPaymentError(
          error instanceof Error
            ? error.message
            : "Unable to create booking request.",
        );
      } finally {
        setSubmittingPayment(false);
      }

      return;
    }

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
            {availableGateways.map((gw) => (
              <PaymentGatewayCard
                key={gw.id}
                gateway={gw}
                selected={selectedGateway === gw.id}
                onSelect={() => setSelectedGateway(gw.id)}
              />
            ))}
            {availableGateways.length === 0 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No payment methods are currently enabled. Please contact
                support.
              </p>
            )}
          </div>

          {selectedGateway === "pay_at_branch" && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                Select Branch
              </p>
              <div className="mt-3 grid gap-2">
                {branches.length === 0 ? (
                  <p className="text-sm text-blue-800/80">
                    No active branches are available right now.
                  </p>
                ) : (
                  branches.map((branch) => (
                    <label
                      key={branch.id}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition ${
                        selectedBranchId === branch.id
                          ? "border-blue-300 bg-white"
                          : "border-blue-100 bg-white/70 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="branch"
                          checked={selectedBranchId === branch.id}
                          onChange={() => setSelectedBranchId(branch.id)}
                          className="mt-0.5 h-4 w-4 border-slate-300 text-blue-600"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {branch.name} ({branch.city})
                          </p>
                          <p className="text-xs text-slate-600">
                            {branch.address}
                          </p>
                          {branch.phone ? (
                            <p className="text-xs text-slate-500">
                              {branch.phone}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
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
        <BookingFlightSummary
          offer={payload.offer}
          tripType={payload.query.tripType}
          overrideTotalPrice={pricing.grandTotal}
        />

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

          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-muted">
              Service Charges ({serviceChargePercent}%)
            </span>
            <span className="font-medium text-foreground">
              {formatMoney(pricing.serviceChargeAmount, payload.offer.currency)}
            </span>
          </div>

          <div className="my-3 border-t border-base-200" />

          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">
              {formatMoney(pricing.grandTotal, payload.offer.currency)}
            </span>
          </div>
          <p className="mt-0.5 text-right text-[11px] text-muted">
            All taxes &amp; fees included
          </p>

          {/* CTA */}
          <button
            type="button"
            disabled={!selectedGateway || submittingPayment}
            onClick={() => void handlePayNow()}
            className="btn btn-primary mt-5 w-full rounded-xl py-3 text-base shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submittingPayment
              ? "Submitting request..."
              : selected
                ? `Pay with ${selected.name}`
                : "Select a payment method"}
          </button>

          {!selectedGateway && (
            <p className="mt-2 text-center text-[11px] text-muted">
              Please choose a payment gateway above to continue.
            </p>
          )}
          {paymentError && (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs text-rose-700">
              {paymentError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
