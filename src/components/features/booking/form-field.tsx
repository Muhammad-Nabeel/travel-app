import type { ReactNode } from "react";

// Shared field styling for the booking forms (DESIGN_IMPROVEMENT_PLAN.md §8):
// 48px inputs, label above, inline error linked by aria-describedby.

export function inputClass(error?: string | null, withIcon = false) {
  return [
    "h-12 w-full rounded-lg border bg-white text-sm text-foreground transition placeholder:text-muted/70",
    "focus:border-brand focus:ring-2 focus:ring-brand/20",
    withIcon ? "pl-10 pr-4" : "px-4",
    error ? "border-deal" : "border-line hover:border-foreground/40",
  ].join(" ");
}

export function errorId(id: string) {
  return `${id}-error`;
}

/** Props that connect an input to its label's error message. */
export function describedBy(id: string, error?: string | null) {
  return error
    ? { "aria-invalid": true as const, "aria-describedby": errorId(id) }
    : {};
}

export function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-deal" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={errorId(id)} className="text-[13px] text-deal">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
