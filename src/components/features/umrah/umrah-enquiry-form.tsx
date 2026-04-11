"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";

import type { PackageRow } from "@/app/api/packages/route";
import { submitServiceRequest } from "@/lib/service-requests";

type Props = {
  pkg: PackageRow;
  nights: number;
  adults: number;
  children: number;
  makkahStars: number;
  madinahStars: number;
  estimatedTotal: number;
};

export function UmrahEnquiryForm({
  pkg,
  nights,
  adults,
  children,
  makkahStars,
  madinahStars,
  estimatedTotal,
}: Props) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate() {
    const next: Partial<typeof form> = {};
    if (!form.customerName.trim()) next.customerName = "Name is required.";
    if (!form.customerEmail.trim()) {
      next.customerEmail = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      next.customerEmail = "Enter a valid email address.";
    }
    if (!form.customerPhone.trim())
      next.customerPhone = "Phone number is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await submitServiceRequest({
        type: "UMRAH",
        title: pkg.title,
        amount: estimatedTotal,
        currency: pkg.currency,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        payload: {
          packageId: pkg.id,
          packageSlug: pkg.slug,
          title: pkg.title,
          subtitle: pkg.subtitle,
          departureCity: pkg.departureCity,
          nights,
          adults,
          children,
          makkahStars,
          madinahStars,
          estimatedTotal,
          currency: pkg.currency,
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
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-10 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <div>
          <h3 className="display-font text-3xl font-semibold text-emerald-800">
            Enquiry submitted!
          </h3>
          <p className="mt-1 text-sm text-emerald-700">
            Thank you,{" "}
            <span className="font-semibold">{form.customerName}</span>. Our team
            will contact you shortly.
          </p>
          {reference && (
            <p className="mt-3 inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold tracking-wide text-emerald-800">
              Ref: {reference}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="customerName"
          className="text-sm font-semibold text-slate-700"
        >
          Full name <span className="text-rose-500">*</span>
        </label>
        <input
          id="customerName"
          type="text"
          autoComplete="name"
          value={form.customerName}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerName: e.target.value }))
          }
          placeholder="e.g. Ahmed Khan"
          className={`h-11 w-full rounded-xl border px-4 text-sm text-slate-800 placeholder-slate-300 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerName
              ? "border-rose-400 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
        />
        {errors.customerName && (
          <p className="text-xs text-rose-500">{errors.customerName}</p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="customerEmail"
          className="text-sm font-semibold text-slate-700"
        >
          Email address <span className="text-rose-500">*</span>
        </label>
        <input
          id="customerEmail"
          type="email"
          autoComplete="email"
          value={form.customerEmail}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerEmail: e.target.value }))
          }
          placeholder="e.g. ahmed@example.com"
          className={`h-11 w-full rounded-xl border px-4 text-sm text-slate-800 placeholder-slate-300 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerEmail
              ? "border-rose-400 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
        />
        {errors.customerEmail && (
          <p className="text-xs text-rose-500">{errors.customerEmail}</p>
        )}
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="customerPhone"
          className="text-sm font-semibold text-slate-700"
        >
          Phone number <span className="text-rose-500">*</span>
        </label>
        <input
          id="customerPhone"
          type="tel"
          autoComplete="tel"
          value={form.customerPhone}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerPhone: e.target.value }))
          }
          placeholder="e.g. +92 300 1234567"
          className={`h-11 w-full rounded-xl border px-4 text-sm text-slate-800 placeholder-slate-300 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerPhone
              ? "border-rose-400 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
        />
        {errors.customerPhone && (
          <p className="text-xs text-rose-500">{errors.customerPhone}</p>
        )}
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="text-sm font-semibold text-slate-700"
        >
          Additional message{" "}
          <span className="text-xs font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Any special requests, preferred dates, or questions..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {serverError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit enquiry
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        We typically respond within 24 hours.
      </p>
    </form>
  );
}
