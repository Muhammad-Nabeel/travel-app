"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

type AutoStepCarouselProps = {
  /** Server-rendered cards; each is wrapped in an item with `itemClassName`. */
  children: ReactNode;
  /** Width/shrink classes for each item wrapper (widths resolve against the viewport). */
  itemClassName: string;
  /** Classes for the track, e.g. the gap and vertical alignment. */
  trackClassName?: string;
  /** Maximum cards advanced per step; capped to the cards fully visible so none are skipped. */
  step?: number;
  intervalMs?: number;
};

function visibleCount(viewport: HTMLElement, track: HTMLElement): number {
  const first = track.firstElementChild as HTMLElement | null;
  if (!first) return 1;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  return Math.max(
    1,
    Math.floor((viewport.clientWidth + gap) / (first.offsetWidth + gap)),
  );
}

/**
 * Advances a row of cards every `intervalMs` and loops forever. The list is
 * cloned only once it overflows, and the jump back to the start happens
 * without a transition at an identical position, so the loop is seamless.
 * Pauses on hover/focus, while the tab is hidden, and for reduced motion.
 */
export function AutoStepCarousel({
  children,
  itemClassName,
  trackClassName = "gap-4",
  step = 5,
  intervalMs = 5000,
}: AutoStepCarouselProps) {
  const items = Children.toArray(children);
  const count = items.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [copies, setCopies] = useState(1);

  // Clone the list only when it overflows, with enough copies to never show a gap.
  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || count === 0) return;

    const observer = new ResizeObserver(() => {
      const visible = visibleCount(viewport, track);
      const advance = Math.min(step, visible);
      setCopies(
        count > visible ? 1 + Math.ceil((advance + visible) / count) : 1,
      );
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [count, step]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    let index = 0;
    const moveTo = (target: number, animate: boolean) => {
      const child = track.children[target] as HTMLElement | undefined;
      track.style.transition = animate ? "transform 700ms ease-in-out" : "none";
      track.style.transform = `translate3d(${-(child?.offsetLeft ?? 0)}px, 0, 0)`;
    };
    moveTo(0, false);

    if (
      copies < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Once past the first copy, snap back to the matching card in it.
    const normalize = () => {
      if (index < count) return;
      index -= count;
      moveTo(index, false);
      void track.offsetWidth; // flush so the next move animates from here
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === track) normalize();
    };
    track.addEventListener("transitionend", onTransitionEnd);

    const timer = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      normalize();
      index += Math.min(step, visibleCount(viewport, track));
      moveTo(index, true);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
      track.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [copies, count, step, intervalMs]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <div
      ref={viewportRef}
      className="overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div
        ref={trackRef}
        className={`relative flex will-change-transform ${trackClassName}`}
      >
        {Array.from({ length: copies }, (_, copy) =>
          items.map((item, i) => (
            <div
              key={`${copy}-${i}`}
              className={itemClassName}
              aria-hidden={copy > 0 || undefined}
              inert={copy > 0 || undefined}
            >
              {item}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
