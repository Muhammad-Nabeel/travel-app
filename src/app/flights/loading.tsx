import { FlightResultCardSkeleton } from "@/components/features/flights/flight-result-card";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";

const SKELETON_COUNT = 4;

export default function FlightsLoading() {
  return (
    <div className="flex-1 py-6">
      <FlightSearchEngine variant="embedded" />

      <section className="section-shell mt-6 pb-40">
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="space-y-4">
            <aside className="surface ring-soft rounded-2xl border border-white/70 p-4">
              <div className="space-y-3">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-5 w-36" />
                <div className="skeleton h-3 w-28" />
              </div>
              <div className="mt-3 rounded-xl border border-base-300 bg-base-200/40 px-3 py-2">
                <div className="space-y-2">
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-5 w-14" />
                </div>
              </div>
            </aside>

            <aside className="surface ring-soft rounded-2xl border border-white/70 p-4">
              <div className="space-y-4">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-24 w-full" />
                <div className="skeleton h-10 w-full" />
              </div>
            </aside>
          </div>

          <div className="space-y-4">
            <div className="surface ring-soft overflow-hidden rounded-2xl border border-white/70">
              <div className="grid grid-cols-2 gap-px bg-base-200 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`sort-skeleton-${index}`}
                    className="bg-base-100 p-4"
                  >
                    <div className="space-y-3">
                      <div className="skeleton h-4 w-24" />
                      <div className="skeleton h-5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <FlightResultCardSkeleton key={`flight-skeleton-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
