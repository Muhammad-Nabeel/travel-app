"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { SectionHeader } from "@/components/shared/section-header";

type Destination = {
  id: string;
  slug: string | null;
  city: string;
  country: string;
  scope: "DOMESTIC" | "INTERNATIONAL";
  iataCode: string | null;
  imageUrl: string | null;
  fare: string;
  notes: string | null;
  gradient: string;
};

const GRADIENTS: Record<string, string> = {
  blue: "linear-gradient(130deg, #274c77 0%, #6096ba 45%, #a3cef1 100%)",
  dark: "linear-gradient(130deg, #2b2d42 0%, #8d99ae 45%, #edf2f4 100%)",
  ocean: "linear-gradient(130deg, #003049 0%, #669bbc 45%, #eae2b7 100%)",
  purple: "linear-gradient(130deg, #4a4e69 0%, #9a8c98 45%, #c9ada7 100%)",
  teal: "linear-gradient(130deg, #005f73 0%, #0a9396 45%, #94d2bd 100%)",
  sunset: "linear-gradient(130deg, #9d0208 0%, #dc2f02 45%, #f48c06 100%)",
  navy: "linear-gradient(130deg, #14213d 0%, #3a506b 45%, #5bc0be 100%)",
};

function DestinationsSkeleton() {
  return (
    <section className="section-shell py-12 md:py-16">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="flex gap-5 overflow-hidden pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[78%] shrink-0 sm:w-64">
            <div className="aspect-4/3 animate-pulse rounded-2xl bg-slate-200" />
            <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-16 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DestinationsSlider() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch("/api/destinations", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDestinations(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (loading) return <DestinationsSkeleton />;

  if (destinations.length === 0) return null;

  const domestic = destinations.filter((d) => d.scope === "DOMESTIC");
  const international = destinations.filter((d) => d.scope === "INTERNATIONAL");

  if (domestic.length === 0 && international.length === 0) return null;

  return (
    <>
      {domestic.length > 0 ? (
        <DestinationCarousel
          items={domestic}
          title="Domestic Destinations"
          subtitle="Top routes within Pakistan"
        />
      ) : null}
      {international.length > 0 ? (
        <DestinationCarousel
          items={international}
          title="International Destinations"
          subtitle="Popular routes beyond Pakistan"
        />
      ) : null}
    </>
  );
}

type DestinationCarouselProps = {
  items: Destination[];
  title: string;
  subtitle: string;
};

function DestinationCarousel({
  items,
  title,
  subtitle,
}: DestinationCarouselProps) {
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <section className="section-shell py-12 md:py-16" aria-label={title}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        onPrev={() => scroll("left")}
        onNext={() => scroll("right")}
        canPrev={canLeft}
        canNext={canRight}
        scrollLabel="destinations"
      />

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="-mx-1 flex snap-x gap-5 overflow-x-auto px-1 pb-3"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {items.map((d) => (
          <Link
            key={d.id}
            href={`/destinations/${d.slug?.trim() ? d.slug : d.id}`}
            className="group block w-[78%] shrink-0 snap-start sm:w-64"
            aria-label={`View details for ${d.city}`}
          >
            <article>
              <div
                className="relative aspect-4/3 overflow-hidden rounded-2xl"
                style={{ background: GRADIENTS[d.gradient] ?? GRADIENTS.blue }}
              >
                {d.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.imageUrl}
                    alt={d.city}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : null}
                {d.iataCode ? (
                  <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-0.5 text-[11px] font-bold tracking-wider text-foreground shadow-card">
                    {d.iataCode}
                  </span>
                ) : null}
              </div>

              <div className="pt-3">
                <h3 className="text-base font-semibold text-foreground group-hover:text-brand">
                  {d.city}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                  <MapPin className="size-3.5 shrink-0" />
                  {d.country}
                </p>
                {d.notes && (
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{d.notes}</p>
                )}
                <p className="mt-1.5 text-sm text-muted">
                  Flights from{" "}
                  <span className="font-semibold text-foreground">{d.fare}</span>
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
