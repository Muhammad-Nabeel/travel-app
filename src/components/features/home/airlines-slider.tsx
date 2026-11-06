import Image from "next/image";

import { AutoStepCarousel } from "@/components/shared/auto-step-carousel";
import { getActiveAirlinePartners } from "@/lib/airline-partners";

export async function AirlinesSlider() {
  const airlines = await getActiveAirlinePartners();
  if (airlines.length === 0) return null;

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

          <AutoStepCarousel
            trackClassName="items-center gap-4"
            itemClassName="shrink-0"
          >
            {airlines.map((airline) => (
              <div
                key={airline.id}
                className="flex h-28 w-36 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-3 transition hover:shadow-card"
              >
                <Image
                  src={airline.logoUrl}
                  alt=""
                  width={128}
                  height={56}
                  className="max-h-10 w-auto object-contain"
                />
                <span className="line-clamp-2 text-center text-xs font-medium leading-4 text-foreground">
                  {airline.name}
                </span>
              </div>
            ))}
          </AutoStepCarousel>
        </div>
      </div>
    </section>
  );
}
