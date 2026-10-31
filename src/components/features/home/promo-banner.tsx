import Image from "next/image";
import Link from "next/link";
import { MoonStar } from "lucide-react";

export function PromoBanner() {
  return (
    <section className="section-shell py-6" aria-label="Umrah packages offer">
      <div className="relative overflow-hidden rounded-3xl bg-navy px-6 py-10 text-white sm:px-10 md:flex md:items-center md:justify-between md:gap-10 md:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-full opacity-60 md:w-3/5"
        >
          <Image
            src="/images/hero-madinah.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-navy via-navy/90 to-navy/30"
        />

        <div className="relative max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
            <MoonStar className="size-3.5 text-gold" />
            Umrah 2026–27
          </span>
          <h2 className="display-font text-3xl leading-tight sm:text-4xl md:text-5xl">
            Umrah packages, planned around you
          </h2>
          <p className="mt-3 text-base leading-7 text-white/75">
            Flights, hotels near the Haram, visa and transport — tailored to
            your dates and budget, with support at every step.
          </p>
        </div>

        <div className="relative mt-8 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
          <Link
            href="/umrah-packages"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy! transition hover:bg-white/90"
          >
            View packages
          </Link>
          <Link
            href="/arrange-a-call"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white! transition hover:bg-white/10"
          >
            Arrange a call
          </Link>
        </div>
      </div>
    </section>
  );
}
