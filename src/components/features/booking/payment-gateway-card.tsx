// ── Payment gateway selectable card ──────────────────────────────────────────
// Add new gateways by appending to the GATEWAYS array in payment-page-client.

export type Gateway = {
  /** Unique key used as the payment method identifier */
  id: string;
  /** Display name */
  name: string;
  /** One-line description shown beneath the name */
  tagline: string;
  /** Tailwind bg class for the logo badge */
  badgeColor: string;
  /** Short label shown inside the badge (until real logos are added) */
  badgeLabel: string;
  /** Tailwind text class for the badge label */
  badgeTextColor: string;
  /** Optional tag shown on the card (e.g. "Recommended") */
  tag?: string;
  /** Accent color class used on the selected ring — defaults to primary */
  accentClass?: string;
};

type PaymentGatewayCardProps = {
  gateway: Gateway;
  selected: boolean;
  onSelect: () => void;
};

export function PaymentGatewayCard({
  gateway,
  selected,
  onSelect,
}: PaymentGatewayCardProps) {
  const { name, tagline, badgeColor, badgeLabel, badgeTextColor, tag } =
    gateway;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-4 rounded-card border p-4 text-left transition",
        selected
          ? "border-brand bg-brand-soft ring-1 ring-brand"
          : "border-line bg-white hover:border-foreground/40",
      ].join(" ")}
    >
      {/* Logo badge */}
      <div
        className={[
          "flex h-11 w-14 shrink-0 select-none items-center justify-center rounded-lg text-[13px] font-bold tracking-tight",
          badgeColor,
          badgeTextColor,
        ].join(" ")}
      >
        {badgeLabel}
      </div>

      {/* Name + tagline */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{name}</span>
          {tag && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
              {tag}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted">{tagline}</p>
      </div>

      {/* Radio indicator */}
      <span
        aria-hidden
        className={[
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition",
          selected ? "border-brand" : "border-line",
        ].join(" ")}
      >
        {selected ? <span className="size-2.5 rounded-full bg-brand" /> : null}
      </span>
    </button>
  );
}
