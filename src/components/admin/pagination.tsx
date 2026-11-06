import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Pagination for admin tables. No "use client" and no hooks here, so server
// pages can use it with `hrefFor` (page links, e.g. bookings); client tables
// pass `onPageChange` and slice their rows with `usePagination`
// (use-pagination.ts).

export const ADMIN_PAGE_SIZE = 10;

export function getPageCount(total: number) {
  return Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
}

/** Clamps a requested page (e.g. from ?page=) into 1..pageCount. */
export function clampPage(page: number, pageCount: number) {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(1, Math.trunc(page)), pageCount);
}

/** Page numbers to show: first, last, and a window around the current page. */
export function pageList(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const itemClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition";
const idleClass = "border-line text-navy/80 hover:bg-subtle";
const activeClass = "border-navy bg-navy text-white";
const disabledClass = "pointer-events-none border-line text-muted/50";

type AdminPaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  /** e.g. "activities" → "Showing 1–20 of 29 activities" */
  label?: string;
} & (
  | { onPageChange: (page: number) => void; hrefFor?: never }
  | { hrefFor: (page: number) => string; onPageChange?: never }
);

export function AdminPagination({
  page,
  pageCount,
  total,
  label = "items",
  onPageChange,
  hrefFor,
}: AdminPaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * ADMIN_PAGE_SIZE + 1;
  const end = Math.min(page * ADMIN_PAGE_SIZE, total);

  const control = (target: number, content: React.ReactNode, ariaLabel: string, state: "idle" | "active" | "disabled") => {
    const className = `${itemClass} ${state === "active" ? activeClass : state === "disabled" ? disabledClass : idleClass}`;
    if (state === "disabled") {
      return (
        <span key={ariaLabel} aria-disabled className={className} aria-label={ariaLabel}>
          {content}
        </span>
      );
    }
    if (hrefFor) {
      return (
        <Link
          key={ariaLabel}
          href={hrefFor(target)}
          aria-label={ariaLabel}
          aria-current={state === "active" ? "page" : undefined}
          className={className}
        >
          {content}
        </Link>
      );
    }
    return (
      <button
        key={ariaLabel}
        type="button"
        onClick={() => onPageChange?.(target)}
        aria-label={ariaLabel}
        aria-current={state === "active" ? "page" : undefined}
        className={className}
      >
        {content}
      </button>
    );
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-xs text-muted">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()} {label}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-1.5">
          {control(page - 1, <ChevronLeft className="size-4" />, "Previous page", page === 1 ? "disabled" : "idle")}
          {pageList(page, pageCount).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-muted">
                …
              </span>
            ) : (
              control(p, p, `Page ${p}`, p === page ? "active" : "idle")
            ),
          )}
          {control(page + 1, <ChevronRight className="size-4" />, "Next page", page === pageCount ? "disabled" : "idle")}
        </div>
      ) : null}
    </nav>
  );
}
