"use client";

import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
    <section className="section-shell py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-48 min-w-55 shrink-0 animate-pulse rounded-2xl bg-slate-200 sm:min-w-65"
          >
            <div className="m-3 h-5 w-10 rounded-md bg-white/40" />
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
    <section className="section-shell py-10" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canLeft}
            aria-label="Scroll destinations left"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canRight}
            aria-label="Scroll destinations right"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-slate-700" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {items.map((d) => (
          <Link
            key={d.id}
            href={`/destinations/${d.slug?.trim() ? d.slug : d.id}`}
            className="block focus-visible:outline-none"
            aria-label={`View details for ${d.city}`}
          >
            <article
              className="relative flex h-48 min-w-55 shrink-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-4 text-white transition hover:-translate-y-0.5 hover:shadow-xl sm:min-w-65"
              style={{ background: GRADIENTS[d.gradient] ?? GRADIENTS.blue }}
            >
              {d.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.imageUrl}
                  alt={d.city}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-transparent" />

              <div className="relative flex items-start justify-between">
                {d.iataCode ? (
                  <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                    {d.iataCode}
                  </span>
                ) : (
                  <span />
                )}
              </div>

              <div className="relative">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 text-white/70" />
                  <p className="text-xs text-white/80">{d.country}</p>
                </div>
                <h3 className="mt-0.5 text-xl font-bold leading-tight">
                  {d.city}
                </h3>
                {d.notes && (
                  <p className="mt-1 text-xs text-white/70">{d.notes}</p>
                )}
                <p className="mt-1.5 text-sm font-semibold text-white">
                  {d.fare}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
