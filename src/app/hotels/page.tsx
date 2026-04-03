import { MapPin, Star } from "lucide-react";

import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { HotelSearchEngine } from "@/components/features/home/hotel-search/hotel-search";
import { hotelResults } from "@/lib/mock-data";

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${stars} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < stars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default function HotelsPage() {
  return (
    <main className="flex-1">
      {/* Hero search */}
      <HotelSearchEngine />

      {/* Featured hotels */}
      <section className="section-shell py-10" aria-label="Featured hotels">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Featured Hotels
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Curated stays near the Haram — real provider data coming soon
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {hotelResults.map((hotel) => (
            <article
              key={hotel.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Colour band */}
              <div className="h-2 w-full bg-linear-to-r from-emerald-500 to-teal-400" />

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                      {hotel.provider}
                    </p>
                    <h3 className="mt-1.5 text-lg font-bold text-slate-900 leading-snug">
                      {hotel.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        {hotel.city} · {hotel.distanceToHaram} from Haram
                      </span>
                    </div>
                  </div>
                  <StarRating stars={hotel.stars} />
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Per night
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                      {hotel.currency}{" "}
                      <span className="text-3xl">{hotel.nightlyRate}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
                  >
                    View rooms
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DestinationsSlider />
      <ActivitiesSlider />
      <BlogSlider />
    </main>
  );
}
