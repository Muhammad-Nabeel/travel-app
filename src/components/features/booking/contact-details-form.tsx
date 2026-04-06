"use client";

import { Mail, Phone } from "lucide-react";
import { useState } from "react";

import type { ContactDetails } from "@/lib/flights/booking-types";

type ContactDetailsFormProps = {
  contact: ContactDetails;
  onChange: (updated: ContactDetails) => void;
};

/** Loose international phone pattern — must start with + and digits */
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;

function validatePhone(value: string) {
  if (!value.trim()) return "Phone number is required";
  if (!PHONE_REGEX.test(value.trim()))
    return "Enter a valid international number e.g. +92 300 1234567";
  return null;
}

function validateEmail(value: string) {
  if (!value.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return "Enter a valid email address";
  return null;
}

export function ContactDetailsForm({
  contact,
  onChange,
}: ContactDetailsFormProps) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const phoneError = phoneTouched ? validatePhone(contact.phone) : null;
  const emailError = emailTouched ? validateEmail(contact.email) : null;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-base-200 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Phone className="size-4" />
        </div>
        <div>
          <p className="font-semibold text-foreground leading-tight">
            Contact Information
          </p>
          <p className="text-xs text-muted">
            E-tickets and updates will be sent here
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid gap-x-4 gap-y-5 p-5 sm:grid-cols-2">
        {/* Phone */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="contact-phone"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Mobile Number<span className="ml-0.5 text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={`input input-bordered w-full pl-9 ${phoneError ? "input-error" : ""}`}
              placeholder="+92 300 1234567"
              value={contact.phone}
              onChange={(e) => onChange({ ...contact, phone: e.target.value })}
              onBlur={() => setPhoneTouched(true)}
            />
          </div>
          {phoneError && <p className="text-[11px] text-error">{phoneError}</p>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="contact-email"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Email Address<span className="ml-0.5 text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="contact-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={`input input-bordered w-full pl-9 ${emailError ? "input-error" : ""}`}
              placeholder="you@example.com"
              value={contact.email}
              onChange={(e) => onChange({ ...contact, email: e.target.value })}
              onBlur={() => setEmailTouched(true)}
            />
          </div>
          {emailError && <p className="text-[11px] text-error">{emailError}</p>}
        </div>
      </div>
    </div>
  );
}
