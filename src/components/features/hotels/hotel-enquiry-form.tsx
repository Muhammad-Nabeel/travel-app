"use client";

import { useState } from "react";
import { BedDouble, CalendarDays, CheckCircle, Loader2, MapPin, Send, Users } from "lucide-react";

import type { HotelSearchQuery } from "@/lib/validations/search";
import { submitServiceRequest } from "@/lib/service-requests";

type HotelEnquiryFormProps = {
  query: HotelSearchQuery;
};

function formatDate(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function countNights(checkIn: string, checkOut: string) {
  const ms =
    new Date(`${checkOut}T00:00:00.000Z`).getTime() -
    new Date(`${checkIn}T00:00:00.000Z`).getTime();
  return Math.round(ms / 86_400_000);
}

function formatGuests(query: HotelSearchQuery) {
  const parts = [`${query.adults} Adult${query.adults === 1 ? "" : "s"}`];
  if (query.children > 0) parts.push(`${query.children} Child${query.children === 1 ? "" : "ren"}`);
  parts.push(`${query.rooms} Room${query.rooms === 1 ? "" : "s"}`);
  return parts.join(", ");
}

const STAY_TYPE_LABEL: Record<HotelSearchQuery["stayType"], string> = {
  "hotel-only": "Hotel only",
  "hotel+flight": "Hotel + flight",
};

/** Shown instead of hotel results until a hotel provider is connected: the stay is already chosen, so only contact details are asked. */
export function HotelEnquiryForm({ query }: HotelEnquiryFormProps) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    message: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const guests = formatGuests(query);
  const nights = countNights(query.checkIn, query.checkOut);
  const nightsLabel = `${nights} night${nights === 1 ? "" : "s"}`;

  function validate() {
    const next: Partial<Record<keyof typeof form, string>> = {};

    if (!form.customerName.trim()) {
      next.customerName = "Name is required.";
    }

    if (!form.customerEmail.trim()) {
      next.customerEmail = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      next.customerEmail = "Enter a valid email address.";
    }

    if (!form.customerPhone.trim()) {
      next.customerPhone = "Phone number is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await submitServiceRequest({
        type: "HOTEL",
        title: `${STAY_TYPE_LABEL[query.stayType]} · ${query.destination} · ${query.checkIn} to ${query.checkOut} (${nightsLabel}) · ${guests}`,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        payload: {
          destination: query.destination,
          checkIn: query.checkIn,
          checkOut: query.checkOut,
          nights,
          adults: query.adults,
          children: query.children,
          rooms: query.rooms,
          stayType: query.stayType,
          message: form.message.trim() || null,
          submittedAt: new Date().toISOString(),
        },
      });

      setReference(response.reference ?? null);
      setStatus("success");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to submit your request. Please try again.",
      );
      setStatus("error");
    }
  }

  const inputClass = (hasError: boolean) =>
    `h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
      hasError ? "border-deal bg-white" : "border-line bg-white"
    }`;

  return (
    <section className="section-shell mt-6 pb-16">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <aside className="h-fit rounded-card border border-line bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">
            Your stay
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-foreground">
            <MapPin className="size-5 text-brand" />
            {query.destination}
          </h2>

          <div className="mt-4 rounded-lg border border-line bg-subtle px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays className="size-4 text-brand" />
              {formatDate(query.checkIn)} → {formatDate(query.checkOut)}
            </p>
            <p className="mt-1 text-sm text-muted">{nightsLabel}</p>
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <Users className="size-4 text-muted" />
            {guests}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <BedDouble className="size-4 text-muted" />
            {STAY_TYPE_LABEL[query.stayType]}
          </p>
        </aside>

        <div className="rounded-card border border-line bg-white p-6">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle className="h-11 w-11 text-success" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  Request received!
                </h3>
                <p className="mt-1 text-sm text-foreground">
                  Thanks {form.customerName.trim()}. Our team will contact you
                  with the best hotel rates for this stay.
                </p>
                {reference ? (
                  <p className="mt-3 inline-block rounded-full bg-success/10 px-4 py-1 text-sm font-semibold text-foreground">
                    Ref: {reference}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Get rates for this stay
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Share your contact details and our travel team will send you
                  the best available hotel rates.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="hotel-name"
                  className="text-sm font-semibold text-foreground"
                >
                  Full name <span className="text-deal">*</span>
                </label>
                <input
                  id="hotel-name"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                  className={inputClass(Boolean(errors.customerName))}
                  placeholder="e.g. Ahmed Khan"
                  autoComplete="name"
                />
                {errors.customerName ? (
                  <p className="text-[13px] text-deal">{errors.customerName}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="hotel-email"
                    className="text-sm font-semibold text-foreground"
                  >
                    Email address <span className="text-deal">*</span>
                  </label>
                  <input
                    id="hotel-email"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerEmail: e.target.value }))
                    }
                    className={inputClass(Boolean(errors.customerEmail))}
                    placeholder="e.g. ahmed@example.com"
                    autoComplete="email"
                  />
                  {errors.customerEmail ? (
                    <p className="text-[13px] text-deal">{errors.customerEmail}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="hotel-phone"
                    className="text-sm font-semibold text-foreground"
                  >
                    Phone <span className="text-deal">*</span>
                  </label>
                  <input
                    id="hotel-phone"
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerPhone: e.target.value }))
                    }
                    className={inputClass(Boolean(errors.customerPhone))}
                    placeholder="+92 300 1234567"
                    autoComplete="tel"
                  />
                  {errors.customerPhone ? (
                    <p className="text-[13px] text-deal">{errors.customerPhone}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="hotel-message"
                  className="text-sm font-semibold text-foreground"
                >
                  Additional message
                </label>
                <textarea
                  id="hotel-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Preferred hotel, distance to the Haram, room type, budget..."
                />
              </div>

              {serverError ? (
                <p className="rounded-lg border border-deal/30 bg-deal/5 px-4 py-3 text-sm text-deal">
                  {serverError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Request hotel rates
                  </>
                )}
              </button>

              <p className="text-center text-xs text-muted">
                We usually respond within 24 hours.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
