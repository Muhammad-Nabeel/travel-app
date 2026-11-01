"use client";

import { Accessibility, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  FormField,
  describedBy,
  inputClass,
} from "@/components/features/booking/form-field";
import type {
  PassengerDetails,
  PassengerType,
} from "@/lib/flights/booking-types";

// ── label helpers ─────────────────────────────────────────────────────────────

const PASSENGER_TYPE_LABEL: Record<PassengerType, string> = {
  adult: "Adult",
  child: "Child",
  infant: "Infant",
};

const PASSENGER_TYPE_SUBTITLE: Record<PassengerType, string> = {
  adult: "12+ years",
  child: "2–11 years",
  infant: "Under 2 years",
};

export type PassengerErrors = Partial<
  Record<"firstName" | "lastName" | "dateOfBirth" | "passportExpiry", string>
>;

export function validatePassenger(p: PassengerDetails): PassengerErrors {
  const errors: PassengerErrors = {};
  if (!p.firstName.trim()) errors.firstName = "Enter the first name";
  if (!p.lastName.trim()) errors.lastName = "Enter the last name";
  if (!p.dateOfBirth) errors.dateOfBirth = "Enter the date of birth";
  if (!p.passportExpiry) errors.passportExpiry = "Enter the passport expiry date";
  return errors;
}

// ── main component ────────────────────────────────────────────────────────────

type PassengerFormProps = {
  passenger: PassengerDetails;
  /** Display number shown in header e.g. "Passenger 1" */
  displayNumber: number;
  onChange: (updated: PassengerDetails) => void;
  /** Show every error, e.g. after a submit attempt. */
  showErrors?: boolean;
};

export function PassengerForm({
  passenger,
  displayNumber,
  onChange,
  showErrors = false,
}: PassengerFormProps) {
  const [open, setOpen] = useState(true);

  function set<K extends keyof PassengerDetails>(
    key: K,
    value: PassengerDetails[K],
  ) {
    onChange({ ...passenger, [key]: value });
  }

  const allErrors = validatePassenger(passenger);
  const complete = Object.keys(allErrors).length === 0;
  const errors: PassengerErrors = showErrors ? allErrors : {};
  // Keep a card with errors open so the messages are visible.
  const expanded = open || (showErrors && !complete);

  const typeLabel = PASSENGER_TYPE_LABEL[passenger.type];
  const fullName = `${passenger.firstName} ${passenger.lastName}`.trim();
  const idBase = `${passenger.type}-${passenger.index}`;
  const panelId = `passenger-${idBase}`;

  return (
    <section className="rounded-card border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            complete ? "bg-success text-white" : "bg-subtle text-foreground"
          }`}
        >
          {complete ? <Check className="size-4" strokeWidth={3} /> : displayNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-foreground">
            {typeLabel} {displayNumber}
            {fullName ? <span className="font-normal text-muted"> · {fullName}</span> : null}
          </span>
          <span className="block text-sm text-muted">
            {PASSENGER_TYPE_SUBTITLE[passenger.type]}
            {complete ? " · Details complete" : ""}
          </span>
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={panelId}
        hidden={!expanded}
        className="grid gap-x-4 gap-y-5 border-t border-line p-5 sm:grid-cols-2"
      >
        <FormField id={`fn-${idBase}`} label="First name" required error={errors.firstName}>
          <input
            id={`fn-${idBase}`}
            type="text"
            className={inputClass(errors.firstName)}
            placeholder="As on passport"
            value={passenger.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            autoComplete="given-name"
            {...describedBy(`fn-${idBase}`, errors.firstName)}
          />
        </FormField>

        <FormField id={`ln-${idBase}`} label="Last name" required error={errors.lastName}>
          <input
            id={`ln-${idBase}`}
            type="text"
            className={inputClass(errors.lastName)}
            placeholder="As on passport"
            value={passenger.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            autoComplete="family-name"
            {...describedBy(`ln-${idBase}`, errors.lastName)}
          />
        </FormField>

        <FormField id={`dob-${idBase}`} label="Date of birth" required error={errors.dateOfBirth}>
          <input
            id={`dob-${idBase}`}
            type="date"
            className={inputClass(errors.dateOfBirth)}
            value={passenger.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
            {...describedBy(`dob-${idBase}`, errors.dateOfBirth)}
          />
        </FormField>

        <FormField
          id={`pe-${idBase}`}
          label="Passport expiry date"
          required
          error={errors.passportExpiry}
        >
          <input
            id={`pe-${idBase}`}
            type="date"
            className={inputClass(errors.passportExpiry)}
            value={passenger.passportExpiry}
            onChange={(e) => set("passportExpiry", e.target.value)}
            {...describedBy(`pe-${idBase}`, errors.passportExpiry)}
          />
        </FormField>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3 transition hover:bg-subtle sm:col-span-2">
          <input
            type="checkbox"
            className="size-5 accent-brand"
            checked={passenger.wheelchairRequired}
            onChange={(e) => set("wheelchairRequired", e.target.checked)}
          />
          <Accessibility className="size-4 text-muted" />
          <span className="text-sm font-medium text-foreground">
            Wheelchair assistance required
          </span>
        </label>
      </div>
    </section>
  );
}
