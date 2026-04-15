"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";

import { submitServiceRequest } from "@/lib/service-requests";
import type { TourPackage } from "@/lib/tour-packages";

type TourEnquiryFormProps = {
  pkg: TourPackage;
};

export function TourEnquiryForm({ pkg }: TourEnquiryFormProps) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    travelers: "2",
    preferredMonth: "",
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
      const estimatedAmount = pkg.pricePerAdult * travelersCount;

      const response = await submitServiceRequest({
        type: "TOUR",
        title: pkg.title,
        amount: estimatedAmount,
        currency: pkg.currency,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        payload: {
          packageId: pkg.id,
          packageTitle: pkg.title,
          destination: pkg.destination,
          duration: pkg.duration,
          tourType: pkg.tourType,
          travelers: travelersCount,
          preferredMonth: form.preferredMonth.trim() || null,
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
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-8 text-center">
        <CheckCircle className="h-11 w-11 text-emerald-500" />
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-emerald-800">
            Enquiry submitted!
          </h3>
          <p className="mt-1 text-sm text-emerald-700">
            Thanks {form.customerName.trim()}. Our team will contact you soon.
          </p>
          {reference ? (
            <p className="mt-3 inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-800">
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
          htmlFor="tour-name"
          className="text-sm font-semibold text-slate-700"
        >
          Full name <span className="text-rose-500">*</span>
        </label>
        <input
          id="tour-name"
          value={form.customerName}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerName: e.target.value }))
          }
          className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerName
              ? "border-rose-400 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
          placeholder="e.g. Ahmed Khan"
          autoComplete="name"
        />
        {errors.customerName ? (
          <p className="text-xs text-rose-500">{errors.customerName}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tour-email"
          className="text-sm font-semibold text-slate-700"
        >
          Email address <span className="text-rose-500">*</span>
        </label>
        <input
          id="tour-email"
          type="email"
          value={form.customerEmail}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerEmail: e.target.value }))
          }
          className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerEmail
              ? "border-rose-400 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
          placeholder="e.g. ahmed@example.com"
          autoComplete="email"
        />
        {errors.customerEmail ? (
          <p className="text-xs text-rose-500">{errors.customerEmail}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="tour-phone"
            className="text-sm font-semibold text-slate-700"
          >
            Phone <span className="text-rose-500">*</span>
          </label>
          <input
            id="tour-phone"
            type="tel"
            value={form.customerPhone}
            onChange={(e) =>
              setForm((f) => ({ ...f, customerPhone: e.target.value }))
            }
            className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
              errors.customerPhone
                ? "border-rose-400 bg-rose-50"
                : "border-slate-200 bg-white"
            }`}
            placeholder="+92 300 1234567"
            autoComplete="tel"
          />
          {errors.customerPhone ? (
            <p className="text-xs text-rose-500">{errors.customerPhone}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="tour-travelers"
            className="text-sm font-semibold text-slate-700"
          >
            Travelers <span className="text-rose-500">*</span>
          </label>
          <input
            id="tour-travelers"
            type="number"
            min={1}
            value={form.travelers}
            onChange={(e) =>
              setForm((f) => ({ ...f, travelers: e.target.value }))
            }
            className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
              errors.travelers
                ? "border-rose-400 bg-rose-50"
                : "border-slate-200 bg-white"
            }`}
            placeholder="2"
          />
          {errors.travelers ? (
            <p className="text-xs text-rose-500">{errors.travelers}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tour-month"
          className="text-sm font-semibold text-slate-700"
        >
          Preferred travel month
        </label>
        <input
          id="tour-month"
          value={form.preferredMonth}
          onChange={(e) =>
            setForm((f) => ({ ...f, preferredMonth: e.target.value }))
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="e.g. September 2026"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tour-message"
          className="text-sm font-semibold text-slate-700"
        >
          Additional message
        </label>
        <textarea
          id="tour-message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="Any specific hotel, dates, or special requirements..."
        />
      </div>

      {serverError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {serverError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit enquiry
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        We usually respond within 24 hours.
      </p>
    </form>
  );
}
