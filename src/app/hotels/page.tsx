import type { Metadata } from "next";
import { BedDouble, Footprints, MapPin, Star } from "lucide-react";

import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { CATALOG_INDEXING } from "@/lib/seo-copy";
import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { HotelSearchEngine } from "@/components/features/home/hotel-search/hotel-search";
import { StructuredData } from "@/components/shared/structured-data";
import { hotelResults } from "@/lib/mock-data";
import { createWebPageSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("hotels", {
    noIndex: !CATALOG_INDEXING.hotels,
  });
}

// Mock hotels carry no photos yet; use a city photo where we have one.
const CITY_IMAGES: Record<string, string> = {
  Madinah: "/images/hero-madinah.jpg",
};

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${stars}-star hotel`}>
      {Array.from({ length: stars }).map((_, i) => (
        <Star key={i} className="size-3.5 fill-foreground text-foreground" />
      ))}
    </div>
  );
}

export default function HotelsPage() {
  return (
    <div className="flex-1">
      <StructuredData
        data={createWebPageSchema({
          title: "Hotels",
          description:
            "Browse featured hotels and compare stays for religious and leisure travel plans.",
          path: "/hotels",
          type: "CollectionPage",
        })}
      />

      {/* Hero search */}
      <HotelSearchEngine />

      {/* Featured hotels */}
      <section className="section-shell py-10" aria-label="Featured hotels">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            Featured hotels
          </h2>
          <p className="mt-1 text-sm text-muted sm:text-base">
            Hand-picked stays close to the Haram in Makkah and Madinah
          </p>
        </div>

        <div className="space-y-4">
          {hotelResults.map((hotel) => {
            const image = CITY_IMAGES[hotel.city];
            return (
              <article
                key={hotel.id}
                className="group grid overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-raised sm:grid-cols-[280px_minmax(0,1fr)_200px]"
              >
                <div className="relative aspect-video overflow-hidden bg-linear-to-br from-brand to-navy sm:aspect-auto sm:min-h-52">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={`${hotel.city} near ${hotel.name}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <BedDouble className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-white/60" />
                  )}
                </div>

                <div className="flex flex-col p-5">
                  <StarRating stars={hotel.stars} />
                  <h3 className="mt-2 text-xl font-semibold leading-snug text-foreground">
                    {hotel.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="size-3.5 shrink-0" />
                    {hotel.city}
                  </p>
                  <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                    <Footprints className="size-3.5" />
                    {hotel.distanceToHaram} from the Haram
                  </p>
                  <p className="mt-auto pt-4 text-xs text-muted">
                    Rates via {hotel.provider}
                  </p>
                </div>

                <div className="flex flex-row items-end justify-between gap-3 border-t border-line p-5 sm:flex-col sm:items-end sm:justify-end sm:border-l sm:border-t-0">
                  <div className="sm:text-right">
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {hotel.currency} {hotel.nightlyRate}
                    </p>
                    <p className="text-xs text-muted">per night</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong sm:w-full"
                  >
                    View rooms
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <DestinationsSlider />
      <ActivitiesSlider />
      <BlogSlider />
    </div>
  );
}
