"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

type MobileSearchToggleProps = {
  summary: string;
  /** Names the search in the collapsed bar, e.g. "Hotel search". */
  label?: string;
  children: React.ReactNode;
};

export function MobileSearchToggle({
  summary,
  label = "Flight search",
  children,
}: MobileSearchToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="w-full">
      <div className="section-shell mb-3 lg:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3 text-left shadow-sm"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={`Toggle ${label.toLowerCase()}`}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
              {label}
            </p>
            <p className="truncate text-sm font-semibold text-base-content">
              {summary}
            </p>
          </div>
          <span className="ml-3 inline-flex items-center gap-1 rounded-lg border border-base-300 px-2.5 py-1.5 text-xs font-semibold text-base-content">
            <Search className="size-3.5" />
            {open ? "Hide" : "Search again"}
            {open ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </span>
        </button>
      </div>

      <div className={open ? "block" : "hidden lg:block"}>{children}</div>
    </section>
  );
}
