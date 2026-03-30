import type { ReactNode } from "react";

type FlightInfoTooltipProps = {
  children: ReactNode;
  /** Tailwind positioning classes, e.g. "bottom-full left-1/2 mb-2 -translate-x-1/2" */
  className?: string;
};

/**
 * Tooltip bubble — must be a direct child of a `group relative` wrapper.
 * It is invisible by default and fades in when the parent wrapper is hovered.
 */
export function FlightInfoTooltip({
  children,
  className = "",
}: FlightInfoTooltipProps) {
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-30 w-max max-w-55 rounded-2xl border border-base-300 bg-base-100 px-3 py-2.5 text-xs shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${className}`}
    >
      {children}
    </span>
  );
}
