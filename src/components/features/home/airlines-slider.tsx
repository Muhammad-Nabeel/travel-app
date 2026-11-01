import Image from "next/image";

import { getStoredAirlineLogos } from "@/lib/admin-settings/airline-logo-settings";

export async function AirlinesSlider() {
  const airlines = (await getStoredAirlineLogos()).filter((item) => item.isActive);
  if (airlines.length === 0) return null;

  // The list is rendered twice so the CSS marquee can loop seamlessly.
  const loopedAirlines = [...airlines, ...airlines];

  return (
    <section className="section-shell py-6 md:py-8" aria-label="Leading airlines">
      <div>
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            Book with leading airlines
          </h2>
          <p className="mt-1 text-sm text-muted sm:text-base">
            Compare fares across top regional and international carriers.
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-white to-transparent" />

          <div className="airline-marquee flex w-max items-center gap-4">
            {loopedAirlines.map((airline, index) => (
              <div
                key={`${airline.id}-${index}`}
                aria-hidden={index >= airlines.length || undefined}
                className="flex h-20 w-36 shrink-0 items-center justify-center rounded-xl border border-line bg-white px-4 py-3 transition hover:shadow-card"
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
