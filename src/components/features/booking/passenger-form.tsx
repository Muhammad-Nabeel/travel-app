"use client";

import { Accessibility, Calendar, CreditCard, User } from "lucide-react";

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

// ── field component ───────────────────────────────────────────────────────────

type FieldProps = {
  id: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
};

function Field({ id, label, children, required }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-muted uppercase tracking-wide"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type PassengerFormProps = {
  passenger: PassengerDetails;
  /** Display number shown in header e.g. "Passenger 1" */
  displayNumber: number;
  onChange: (updated: PassengerDetails) => void;
};

export function PassengerForm({
  passenger,
  displayNumber,
  onChange,
}: PassengerFormProps) {
  function set<K extends keyof PassengerDetails>(
    key: K,
    value: PassengerDetails[K],
  ) {
    onChange({ ...passenger, [key]: value });
  }

  const typeLabel = PASSENGER_TYPE_LABEL[passenger.type];
  const typeSubtitle = PASSENGER_TYPE_SUBTITLE[passenger.type];

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 border-b border-base-200 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <User className="size-4" />
        </div>
        <div>
          <p className="font-semibold text-foreground leading-tight">
            Passenger {displayNumber} — {typeLabel}
          </p>
          <p className="text-xs text-muted">{typeSubtitle}</p>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid gap-x-4 gap-y-5 p-5 sm:grid-cols-2">
        {/* First name */}
        <Field
          id={`fn-${passenger.type}-${passenger.index}`}
          label="First Name"
          required
        >
          <input
            id={`fn-${passenger.type}-${passenger.index}`}
            type="text"
            className="input input-bordered w-full"
            placeholder="As on passport"
            value={passenger.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            autoComplete="given-name"
          />
        </Field>

        {/* Last name */}
        <Field
          id={`ln-${passenger.type}-${passenger.index}`}
          label="Last Name"
          required
        >
          <input
            id={`ln-${passenger.type}-${passenger.index}`}
            type="text"
            className="input input-bordered w-full"
            placeholder="As on passport"
            value={passenger.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            autoComplete="family-name"
          />
        </Field>

        {/* Date of birth */}
        <Field
          id={`dob-${passenger.type}-${passenger.index}`}
          label="Date of Birth"
          required
        >
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id={`dob-${passenger.type}-${passenger.index}`}
              type="date"
              className="input input-bordered w-full pl-9"
              value={passenger.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </div>
        </Field>

        {/* Passport expiry */}
        <Field
          id={`pe-${passenger.type}-${passenger.index}`}
          label="Passport Expiry Date"
          required
        >
          <div className="relative">
            <CreditCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id={`pe-${passenger.type}-${passenger.index}`}
              type="date"
              className="input input-bordered w-full pl-9"
              value={passenger.passportExpiry}
              onChange={(e) => set("passportExpiry", e.target.value)}
            />
          </div>
        </Field>

        {/* Wheelchair */}
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-base-300 px-4 py-3 transition hover:bg-base-200/50">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={passenger.wheelchairRequired}
              onChange={(e) => set("wheelchairRequired", e.target.checked)}
            />
            <div className="flex items-center gap-2">
              <Accessibility className="size-4 text-muted" />
              <span className="text-sm font-medium text-foreground">
                Wheelchair assistance required
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
