"use client";

import { Mail, Phone } from "lucide-react";
import { useState } from "react";

import {
  FormField,
  describedBy,
  inputClass,
} from "@/components/features/booking/form-field";
import type { ContactDetails } from "@/lib/flights/booking-types";

type ContactDetailsFormProps = {
  contact: ContactDetails;
  onChange: (updated: ContactDetails) => void;
  /** Show every error, e.g. after a submit attempt. */
  showErrors?: boolean;
};

/** Loose international phone pattern — must start with + and digits */
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;

export function validatePhone(value: string) {
  if (!value.trim()) return "Enter a phone number";
  if (!PHONE_REGEX.test(value.trim()))
    return "Enter a valid international number, e.g. +92 300 1234567";
  return null;
}

export function validateEmail(value: string) {
  if (!value.trim()) return "Enter an email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return "Enter a valid email address";
  return null;
}

export function ContactDetailsForm({
  contact,
  onChange,
  showErrors = false,
}: ContactDetailsFormProps) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const phoneError =
    phoneTouched || showErrors ? validatePhone(contact.phone) : null;
  const emailError =
    emailTouched || showErrors ? validateEmail(contact.email) : null;

  return (
    <section className="rounded-card border border-line bg-white">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">
          Contact details
        </h2>
        <p className="text-sm text-muted">
          We send your e-tickets and trip updates here.
        </p>
      </div>

      <div className="grid gap-x-4 gap-y-5 p-5 sm:grid-cols-2">
        <FormField id="contact-phone" label="Mobile number" required error={phoneError}>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={inputClass(phoneError, true)}
              placeholder="+92 300 1234567"
              value={contact.phone}
              onChange={(e) => onChange({ ...contact, phone: e.target.value })}
              onBlur={() => setPhoneTouched(true)}
              {...describedBy("contact-phone", phoneError)}
            />
          </div>
        </FormField>

        <FormField id="contact-email" label="Email address" required error={emailError}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="contact-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={inputClass(emailError, true)}
              placeholder="you@example.com"
              value={contact.email}
              onChange={(e) => onChange({ ...contact, email: e.target.value })}
              onBlur={() => setEmailTouched(true)}
              {...describedBy("contact-email", emailError)}
            />
          </div>
        </FormField>
      </div>
    </section>
  );
}
