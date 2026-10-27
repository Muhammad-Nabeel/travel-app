import type { LucideIcon } from "lucide-react";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

// Building blocks shared by the detail pages (DESIGN_IMPROVEMENT_PLAN.md §7).

/** Anchor id of the enquiry section that booking CTAs scroll to. */
export const ENQUIRE_ID = "enquire";

export function DetailSection({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-8 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-[22px]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export type Fact = { icon: LucideIcon; label: string; value: ReactNode };

export function FactGrid({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {facts.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex items-start gap-3 rounded-xl border border-line px-4 py-3"
        >
          <Icon className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.75} />
          <div className="min-w-0">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-sm font-semibold text-foreground">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export function CheckList({
  items,
  tone = "included",
}: {
  items: string[];
  tone?: "included" | "excluded";
}) {
  const Icon = tone === "included" ? Check : X;
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
          <Icon
            className={`mt-0.5 size-4 shrink-0 ${tone === "included" ? "text-success" : "text-muted"}`}
            strokeWidth={2.25}
            aria-hidden
          />
          <span>
            <span className="sr-only">
              {tone === "included" ? "Included: " : "Not included: "}
            </span>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function InclusionLists({
  included,
  excluded,
}: {
  included: string[];
  excluded: string[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {included.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Included</h3>
          <CheckList items={included} />
        </div>
      ) : null}
      {excluded.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Not included</h3>
          <CheckList items={excluded} tone="excluded" />
        </div>
      ) : null}
    </div>
  );
}

/** Two-column detail body: content left, sticky booking card right. */
export function DetailLayout({
  children,
  aside,
}: {
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <div className="min-w-0">{children}</div>
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--app-header-height)+1.5rem)]">{aside}</div>
      </aside>
    </div>
  );
}

export function TrustNotes({ notes }: { notes: string[] }) {
  return (
    <ul className="space-y-2">
      {notes.map((note) => (
        <li key={note} className="flex items-start gap-2 text-sm text-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.25} />
          {note}
        </li>
      ))}
    </ul>
  );
}

type PriceProps = {
  /** e.g. "from" or "Total for 2 travellers" */
  label?: string;
  amount: string;
  /** e.g. "per adult", "SAR 17,900 per person" */
  note?: ReactNode;
};

function Price({ label, amount, note }: PriceProps) {
  return (
    <div>
      {label ? <p className="text-sm text-muted">{label}</p> : null}
      <p className="text-[28px] font-bold leading-tight tabular-nums text-foreground">
        {amount}
      </p>
      {note ? <p className="text-sm text-muted">{note}</p> : null}
    </div>
  );
}

export function BookingCard({
  price,
  children,
  ctaLabel = "Enquire now",
  ctaHref = `#${ENQUIRE_ID}`,
  footer,
}: {
  price: PriceProps;
  children?: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card">
      <Price {...price} />
      {children ? <div className="mt-5 border-t border-line pt-5">{children}</div> : null}
      <a
        href={ctaHref}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-white transition hover:bg-brand-strong"
      >
        {ctaLabel}
      </a>
      {footer ? <div className="mt-5">{footer}</div> : null}
    </div>
  );
}

/** Summary rows inside a booking card. */
export function SummaryRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="space-y-2.5 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <dt className="text-muted">{row.label}</dt>
          <dd className="text-right font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Phones and tablets: price + CTA pinned to the bottom of the screen. */
export function MobileBookingBar({
  amount,
  note,
  ctaLabel = "Enquire now",
  ctaHref = `#${ENQUIRE_ID}`,
}: {
  amount: string;
  note?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div
      data-booking-bar
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tabular-nums text-foreground">{amount}</p>
          {note ? <p className="truncate text-xs text-muted">{note}</p> : null}
        </div>
        <a
          href={ctaHref}
          className="flex h-11 shrink-0 items-center rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}

/** Page wrapper that leaves room for the mobile booking bar. */
export function DetailPage({ children }: { children: ReactNode }) {
  return <div className="flex-1 pb-28 pt-6 lg:pb-16">{children}</div>;
}

export function DetailTitle({
  title,
  badge,
  meta,
  subtitle,
}: {
  title: string;
  badge?: ReactNode;
  meta?: ReactNode;
  subtitle?: string | null;
}) {
  return (
    <header className="mt-4 mb-6">
      {badge ? <div className="mb-2">{badge}</div> : null}
      <h1 className="text-balance text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {subtitle ? <p className="mt-2 max-w-3xl text-base text-muted">{subtitle}</p> : null}
      {meta ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground">
          {meta}
        </div>
      ) : null}
    </header>
  );
}

/** Mobile-only copy of the booking card's summary, shown above the enquiry form. */
export function MobileOnly({ children }: { children: ReactNode }) {
  return <div className="lg:hidden">{children}</div>;
}
