"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type AirlineLogoEntry = {
  id: string;
  name: string;
  src: string;
  storagePath: string | null;
  isActive: boolean;
  sortOrder: number;
};

const FALLBACK_AIRLINES = [
  { name: "Emirates", src: "/airlines/ek.gif" },
  { name: "Qatar Airways", src: "/airlines/qr.gif" },
  { name: "Etihad Airways", src: "/airlines/ey.gif" },
  { name: "Turkish Airlines", src: "/airlines/tk.gif" },
  { name: "British Airways", src: "/airlines/ba.gif" },
  { name: "Saudi", src: "/airlines/sv.gif" },
];

export function AirlinesSlider() {
  const [airlines, setAirlines] = useState(FALLBACK_AIRLINES);

  useEffect(() => {
    async function loadLogos() {
      try {
        const res = await fetch("/api/admin/settings/airline-logos", {
          cache: "no-store",
        });
        const json = (await res.json()) as { logos?: AirlineLogoEntry[] };
        if (!res.ok || !Array.isArray(json.logos)) {
          return;
        }

        const next = json.logos
          .filter((item) => item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            name: item.name,
            src: item.src,
          }));

        if (next.length > 0) {
          setAirlines(next);
        }
      } catch {
        // Keep fallback logos when settings API is unavailable.
      }
    }

    void loadLogos();
  }, []);

  const loopedAirlines = useMemo(() => [...airlines, ...airlines], [airlines]);

  return (
    <section className="section-shell py-10" aria-label="Leading airlines">
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
              Trusted airline partners
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Book with leading airlines
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Search and compare fares across top regional and international
              carriers in one place.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-white to-transparent" />

          <div className="airline-marquee flex w-max items-center gap-4">
            {loopedAirlines.map((airline, index) => (
              <div
                key={`${airline.name}-${index}`}
                className="flex h-24 w-40 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <Image
                  src={airline.src}
                  alt={airline.name}
                  width={128}
                  height={56}
                  className="max-h-12 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
