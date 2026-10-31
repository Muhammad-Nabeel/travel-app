"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";

import { SectionHeader } from "@/components/shared/section-header";

type CardCarouselProps = Pick<
  ComponentProps<typeof SectionHeader>,
  "title" | "subtitle" | "badge" | "href" | "hrefLabel" | "scrollLabel"
> & {
  ariaLabel: string;
  /** Server-rendered cards; only the arrows and scrolling run on the client. */
  children: ReactNode;
};

const CARD_GAP = 20;

export function CardCarousel({ ariaLabel, children, ...header }: CardCarouselProps) {
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + CARD_GAP : 300;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="section-shell py-12 md:py-16" aria-label={ariaLabel}>
      <SectionHeader
        {...header}
        onPrev={() => scroll("left")}
        onNext={() => scroll("right")}
        canPrev={canLeft}
        canNext={canRight}
      />

      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="-mx-1 flex snap-x gap-5 overflow-x-auto px-1 pb-3"
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>
    </section>
  );
}
