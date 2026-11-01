import { Check } from "lucide-react";

const STEPS = ["Details", "Payment", "Confirmation"] as const;

/** Progress indicator for the booking flow; `current` is 0-based. */
export function BookingSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <nav aria-label="Booking progress" className="border-b border-line bg-white">
      <ol className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-4 sm:gap-4">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 sm:gap-4 last:flex-none">
              <span
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2 text-sm font-semibold ${
                  active ? "text-foreground" : done ? "text-foreground" : "text-muted"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${
                    done
                      ? "bg-success text-white"
                      : active
                        ? "bg-brand text-white"
                        : "border border-line bg-white text-muted"
                  }`}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={active ? "" : "hidden sm:inline"}>{label}</span>
                {done ? <span className="sr-only">(completed)</span> : null}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={`h-px flex-1 ${done ? "bg-success" : "bg-line"}`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
