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
        "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-150",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-base-200 bg-base-100 hover:border-base-300 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Logo badge */}
      <div
        className={[
          "flex h-12 w-[3.75rem] shrink-0 items-center justify-center rounded-xl text-[13px] font-bold tracking-tight select-none",
          badgeColor,
          badgeTextColor,
        ].join(" ")}
      >
        {badgeLabel}
      </div>

      {/* Name + tagline */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{name}</span>
          {tag && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              {tag}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted">{tagline}</p>
      </div>

      {/* Radio indicator */}
      <div
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
          selected
            ? "border-primary bg-primary"
            : "border-base-300 bg-base-100",
        ].join(" ")}
      >
        {selected && (
          <svg viewBox="0 0 20 20" fill="white" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
