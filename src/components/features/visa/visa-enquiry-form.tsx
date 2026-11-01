"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";

import type { VisaCountryEntry } from "@/lib/admin-settings/visa-settings";
import { submitServiceRequest } from "@/lib/service-requests";

type VisaEnquiryFormProps = {
  visa: VisaCountryEntry;
};

export function VisaEnquiryForm({ visa }: VisaEnquiryFormProps) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    travelers: "1",
    travelDate: "",
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

  function validate() {
    const next: Partial<Record<keyof typeof form, string>> = {};

    if (!form.customerName.trim()) next.customerName = "Name is required.";

    if (!form.customerEmail.trim()) {
      next.customerEmail = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      next.customerEmail = "Enter a valid email address.";
    }

    if (!form.customerPhone.trim())
      next.customerPhone = "Phone number is required.";

    const travelersCount = Number(form.travelers);
    if (!Number.isFinite(travelersCount) || travelersCount < 1) {
      next.travelers = "Enter at least 1 traveler.";
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
      const travelersCount = Math.max(1, Number(form.travelers) || 1);
      const response = await submitServiceRequest({
        type: "VISA",
        title: `${visa.country} ${visa.visaType === "e-visa" ? "e-Visa" : "Sticker Visa"}`,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        payload: {
          country: visa.country,
          visaType: visa.visaType,
          duration: visa.duration,
          entry: visa.entry,
          netCost: visa.netCost,
          perPersonCost: visa.perPersonCost,
          serviceFee: visa.serviceFee,
          travelers: travelersCount,
          travelDate: form.travelDate || null,
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
          : "Unable to submit enquiry. Please try again.",
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-success/20 bg-success/5 p-8 text-center">
        <CheckCircle className="h-11 w-11 text-success" />
        <div>
          <h3 className="text-2xl font-bold text-foreground">
            Request submitted!
          </h3>
          <p className="mt-1 text-sm text-foreground">
            Thanks {form.customerName.trim()}. Our visa team will contact you
            shortly.
          </p>
          {reference ? (
            <p className="mt-3 inline-block rounded-full bg-success/10 px-4 py-1 text-sm font-semibold text-foreground">
              Ref: {reference}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="visa-name"
          className="text-sm font-semibold text-foreground"
        >
          Full name <span className="text-deal">*</span>
        </label>
        <input
          id="visa-name"
          value={form.customerName}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerName: e.target.value }))
          }
          className={`h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerName
              ? "border-deal bg-white"
              : "border-line bg-white"
          }`}
          placeholder="e.g. Ahmed Khan"
          autoComplete="name"
        />
        {errors.customerName ? (
          <p className="text-[13px] text-deal">{errors.customerName}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="visa-email"
          className="text-sm font-semibold text-foreground"
        >
          Email address <span className="text-deal">*</span>
        </label>
        <input
          id="visa-email"
          type="email"
          value={form.customerEmail}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerEmail: e.target.value }))
          }
          className={`h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerEmail
              ? "border-deal bg-white"
              : "border-line bg-white"
          }`}
          placeholder="e.g. ahmed@example.com"
          autoComplete="email"
        />
        {errors.customerEmail ? (
          <p className="text-[13px] text-deal">{errors.customerEmail}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="visa-phone"
            className="text-sm font-semibold text-foreground"
          >
            Phone <span className="text-deal">*</span>
          </label>
          <input
            id="visa-phone"
            type="tel"
            value={form.customerPhone}
            onChange={(e) =>
              setForm((f) => ({ ...f, customerPhone: e.target.value }))
            }
            className={`h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
              errors.customerPhone
                ? "border-deal bg-white"
                : "border-line bg-white"
            }`}
            placeholder="+92 300 1234567"
            autoComplete="tel"
          />
          {errors.customerPhone ? (
            <p className="text-[13px] text-deal">{errors.customerPhone}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="visa-travelers"
            className="text-sm font-semibold text-foreground"
          >
            Travelers <span className="text-deal">*</span>
          </label>
          <input
            id="visa-travelers"
            type="number"
            min={1}
            value={form.travelers}
            onChange={(e) =>
              setForm((f) => ({ ...f, travelers: e.target.value }))
            }
            className={`h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
              errors.travelers
                ? "border-deal bg-white"
                : "border-line bg-white"
            }`}
            placeholder="1"
          />
          {errors.travelers ? (
            <p className="text-[13px] text-deal">{errors.travelers}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="visa-date"
          className="text-sm font-semibold text-foreground"
        >
          Intended travel date
        </label>
        <input
          id="visa-date"
          type="date"
          value={form.travelDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, travelDate: e.target.value }))
          }
          className="h-12 w-full rounded-lg border border-line bg-white px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="visa-message"
          className="text-sm font-semibold text-foreground"
        >
          Additional message
        </label>
        <textarea
          id="visa-message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full resize-none rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="Any document questions or special support needed..."
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
            Submit visa request
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted">
        We usually respond within 24 hours.
      </p>
    </form>
  );
}
