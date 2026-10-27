"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";

import type { PackageRow } from "@/app/api/packages/route";
import { submitServiceRequest } from "@/lib/service-requests";

type Props = {
  pkg: PackageRow;
  nights: number;
  adults: number;
  childCount: number;
  makkahStars: number;
  madinahStars: number;
  estimatedTotal: number;
};

export function UmrahEnquiryForm({
  pkg,
  nights,
  adults,
  childCount,
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
          childCount,
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
      <div className="flex flex-col items-center gap-4 rounded-card border border-success/20 bg-success/5 p-10 text-center">
        <CheckCircle className="h-12 w-12 text-success" />
        <div>
          <h3 className="text-2xl font-bold text-foreground">
            Enquiry submitted!
          </h3>
          <p className="mt-1 text-sm text-foreground">
            Thank you,{" "}
            <span className="font-semibold">{form.customerName}</span>. Our team
            will contact you shortly.
          </p>
          {reference && (
            <p className="mt-3 inline-block rounded-full bg-success/10 px-4 py-1 text-sm font-semibold tracking-wide text-foreground">
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
          className="text-sm font-semibold text-foreground"
        >
          Full name <span className="text-deal">*</span>
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
          className={`h-12 w-full rounded-lg border px-4 text-sm text-foreground placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerName
              ? "border-deal bg-white"
              : "border-line bg-white"
          }`}
        />
        {errors.customerName && (
          <p className="text-[13px] text-deal">{errors.customerName}</p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="customerEmail"
          className="text-sm font-semibold text-foreground"
        >
          Email address <span className="text-deal">*</span>
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
          className={`h-12 w-full rounded-lg border px-4 text-sm text-foreground placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerEmail
              ? "border-deal bg-white"
              : "border-line bg-white"
          }`}
        />
        {errors.customerEmail && (
          <p className="text-[13px] text-deal">{errors.customerEmail}</p>
        )}
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="customerPhone"
          className="text-sm font-semibold text-foreground"
        >
          Phone number <span className="text-deal">*</span>
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
          className={`h-12 w-full rounded-lg border px-4 text-sm text-foreground placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.customerPhone
              ? "border-deal bg-white"
              : "border-line bg-white"
          }`}
        />
        {errors.customerPhone && (
          <p className="text-[13px] text-deal">{errors.customerPhone}</p>
        )}
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="text-sm font-semibold text-foreground"
        >
          Additional message{" "}
          <span className="text-xs font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Any special requests, preferred dates, or questions..."
          className="w-full resize-none rounded-lg border border-line bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {serverError && (
        <p className="rounded-lg border border-deal/30 bg-deal/5 px-4 py-3 text-sm text-deal">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
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

      <p className="text-center text-xs text-muted">
        We typically respond within 24 hours.
      </p>
    </form>
  );
}
