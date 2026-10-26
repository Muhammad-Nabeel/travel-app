import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  /** Small note above the title, e.g. a "sample content" badge. */
  badge?: ReactNode;
  href?: string;
  hrefLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  /** Used in the arrow buttons' aria-labels, e.g. "destinations". */
  scrollLabel?: string;
};

const arrowClass =
  "flex size-10 items-center justify-center rounded-full border border-line bg-white text-foreground transition hover:border-foreground/40 hover:shadow-card disabled:pointer-events-none disabled:opacity-35";

export function SectionHeader({
  title,
  subtitle,
  badge,
  href,
  hrefLabel = "See all",
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  scrollLabel = "items",
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {badge ? <div className="mb-2">{badge}</div> : null}
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {href ? (
          <Link
            href={href}
            className="text-sm font-semibold text-brand transition hover:text-brand-strong"
          >
            {hrefLabel}
          </Link>
        ) : null}
        {onPrev && onNext ? (
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canPrev}
              aria-label={`Scroll ${scrollLabel} left`}
              className={arrowClass}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              aria-label={`Scroll ${scrollLabel} right`}
              className={arrowClass}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
