"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Loader2, Lock, ShieldCheck } from "lucide-react";

import { BookingFlightSummary } from "@/components/features/booking/booking-flight-summary";
import { BookingSteps } from "@/components/features/booking/booking-steps";
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

const OFFLINE_GATEWAYS = new Set(["cash_on_delivery", "pay_at_branch"]);

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
  const [chosenGateway, setSelectedGateway] = useState<string | null>(null);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [paymentSwitches, setPaymentSwitches] = useState(
    DEFAULT_PAYMENT_SWITCHES,
  );
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmed, setConfirmed] = useState<{
    reference: string | null;
    method: string;
  } | null>(null);

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
  // A choice is dropped if the site settings later disable that gateway.
  const selectedGateway = availableGateways.some((g) => g.id === chosenGateway)
    ? chosenGateway
    : null;


  if (!payload) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-brand" aria-label="Loading" />
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
    setNotice("");

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
        setConfirmed({
          reference: json.reference ?? null,
          method: selected?.name ?? selectedGateway,
        });
        window.scrollTo({ top: 0 });
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
    setNotice(
      `Online payment with ${selected?.name ?? "this method"} is not available yet. Choose Cash on Delivery or Pay at Branch, or contact us to complete your booking.`,
    );
  }

  const total = formatMoney(pricing.grandTotal, payload.offer.currency);
  const isOffline = selectedGateway ? OFFLINE_GATEWAYS.has(selectedGateway) : false;

  if (confirmed) {
    return (
      <>
        <BookingSteps current={2} />
        <div className="mx-auto w-full max-w-2xl px-4 py-12 text-center">
          <CheckCircle2 className="mx-auto size-14 text-success" strokeWidth={1.75} />
          <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight text-foreground">
            Booking request received
          </h1>
          <p className="mt-2 text-base text-muted">
            A travel adviser will contact you on {payload.contact.phone}
            {payload.contact.email ? ` or ${payload.contact.email}` : ""} to
            confirm your seats and arrange payment ({confirmed.method}).
          </p>
          {confirmed.reference ? (
            <p className="mt-6 inline-flex flex-col rounded-card border border-line px-6 py-4">
              <span className="text-sm text-muted">Booking reference</span>
              <span className="text-xl font-bold tracking-wide text-foreground">
                {confirmed.reference}
              </span>
            </p>
          ) : null}
          <div className="mt-8 text-left">
            <BookingFlightSummary
              offer={payload.offer}
              tripType={payload.query.tripType}
              overrideTotalPrice={pricing.grandTotal}
            />
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex h-12 items-center justify-center rounded-full bg-brand px-7 text-base font-semibold text-white transition hover:bg-brand-strong"
            >
              Back to home
            </Link>
            <Link
              href="/flights"
              className="flex h-12 items-center justify-center rounded-full border border-line px-7 text-base font-semibold text-foreground transition hover:bg-subtle"
            >
              Search more flights
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <BookingSteps current={1} />
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      {/* ── Left column ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex w-fit items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
        >
          <ChevronLeft className="size-4" />
          Edit traveller details
        </button>

        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
            How would you like to pay?
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your booking is confirmed once payment is received.
          </p>
        </div>

        {/* Gateway selection */}
        <section aria-labelledby="payment-methods-heading">
          <h2 id="payment-methods-heading" className="mb-3 text-base font-semibold text-foreground">
            Payment method
          </h2>
          <div
            className="flex flex-col gap-3"
            role="radiogroup"
            aria-labelledby="payment-methods-heading"
          >
            {availableGateways.map((gw) => (
              <PaymentGatewayCard
                key={gw.id}
                gateway={gw}
                selected={selectedGateway === gw.id}
                onSelect={() => {
                  setSelectedGateway(gw.id);
                  setNotice("");
                  setPaymentError("");
                }}
              />
            ))}
            {availableGateways.length === 0 && (
              <p className="rounded-lg border border-line bg-subtle px-4 py-3 text-sm text-foreground">
                No payment methods are available right now. Please contact
                support to complete your booking.
              </p>
            )}
          </div>

          {selectedGateway === "pay_at_branch" && (
            <fieldset className="mt-4 rounded-card border border-line p-4">
              <legend className="px-1 text-sm font-semibold text-foreground">
                Choose a branch
              </legend>
              <div className="mt-2 grid gap-2">
                {branches.length === 0 ? (
                  <p className="text-sm text-muted">
                    No branches are available right now.
                  </p>
                ) : (
                  branches.map((branch) => (
                    <label
                      key={branch.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                        selectedBranchId === branch.id
                          ? "border-brand bg-brand-soft ring-1 ring-brand"
                          : "border-line bg-white hover:border-foreground/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="branch"
                        checked={selectedBranchId === branch.id}
                        onChange={() => setSelectedBranchId(branch.id)}
                        className="mt-0.5 size-4 accent-brand"
                      />
                      <span>
                        <span className="block font-semibold text-foreground">
                          {branch.name} ({branch.city})
                        </span>
                        <span className="block text-muted">{branch.address}</span>
                        {branch.phone ? (
                          <span className="block text-muted">{branch.phone}</span>
                        ) : null}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>
          )}
        </section>

        {/* Traveller snapshot */}
        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="text-base font-semibold text-foreground">
            Travellers ({totalPassengers})
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {payload.passengers.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-medium text-foreground">
                  {[p.firstName, p.lastName].filter(Boolean).join(" ") || "—"}
                </span>
                <span className="text-muted">{PASSENGER_LABEL[p.type] ?? p.type}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
            <span className="font-medium text-foreground">Contact: </span>
            {payload.contact.phone}
            {payload.contact.email ? ` · ${payload.contact.email}` : ""}
          </p>
        </section>

        <p className="flex items-start gap-2 text-sm text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
          Card payments are handled by the payment provider over an encrypted
          connection. We never store your card details.
        </p>
      </div>

      {/* ── Right column: trip summary + pay ─────────────────────────────── */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--app-header-height)+1.5rem)]">
        <BookingFlightSummary
          offer={payload.offer}
          tripType={payload.query.tripType}
          overrideTotalPrice={pricing.grandTotal}
        />

        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Price details</h2>

          <dl className="space-y-2 text-sm">
            {(["adult", "child", "infant"] as const).map((type) => {
              const count = payload.passengers.filter((p) => p.type === type).length;
              if (!count) return null;
              return (
                <div key={type} className="flex items-center justify-between">
                  <dt className="text-muted">
                    {PASSENGER_LABEL[type]} × {count}
                  </dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {formatMoney(
                      (payload.offer.price / totalPassengers) * count,
                      payload.offer.currency,
                    )}
                  </dd>
                </div>
              );
            })}
            <div className="flex items-center justify-between">
              <dt className="text-muted">Service charge ({serviceChargePercent}%)</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatMoney(pricing.serviceChargeAmount, payload.offer.currency)}
              </dd>
            </div>
          </dl>

          <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold tabular-nums text-foreground">{total}</span>
          </div>
          <p className="mt-0.5 text-right text-xs text-muted">Taxes and fees included</p>

          <button
            type="button"
            disabled={!selectedGateway || submittingPayment}
            onClick={() => void handlePayNow()}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submittingPayment ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending request…
              </>
            ) : !selected ? (
              "Choose a payment method"
            ) : isOffline ? (
              `Request booking · ${total}`
            ) : (
              <>
                <Lock className="size-4" />
                Pay {total}
              </>
            )}
          </button>

          {paymentError ? (
            <p role="alert" className="mt-3 text-center text-[13px] text-deal">
              {paymentError}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-3 rounded-lg bg-subtle px-3 py-2 text-[13px] text-foreground">
              {notice}
            </p>
          ) : null}
        </section>
      </aside>
    </div>
    </>
  );
}
