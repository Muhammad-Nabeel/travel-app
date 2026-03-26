import { Building2 } from "lucide-react";

import { hotelResults } from "@/lib/mock-data";

export default function HotelsPage() {
  return (
    <main className="section-shell flex-1 py-14">
      <div className="surface ring-soft rounded-[2rem] border border-white/80 p-8">
        <div className="flex items-center gap-3">
          <Building2 className="size-6 text-accent" />
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">
              Hotels
            </p>
            <h1 className="display-font text-5xl text-brand-strong">
              Hotel search foundation
            </h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <label className="form-control">
            <span className="label-text mb-2 text-sm text-muted">City</span>
            <input
              className="input input-bordered rounded-2xl bg-white"
              defaultValue="Makkah"
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 text-sm text-muted">Check-in</span>
            <input
              className="input input-bordered rounded-2xl bg-white"
              defaultValue="2026-04-12"
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 text-sm text-muted">
              Check-out
            </span>
            <input
              className="input input-bordered rounded-2xl bg-white"
              defaultValue="2026-04-17"
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 text-sm text-muted">Guests</span>
            <input
              className="input input-bordered rounded-2xl bg-white"
              defaultValue="2"
            />
          </label>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted">
          Results below are normalized placeholders so the real provider mapping
          can be added without changing the UI shape.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {hotelResults.map((hotel) => (
            <article
              key={hotel.id}
              className="rounded-[1.5rem] border border-black/5 bg-white/80 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-muted">
                    {hotel.provider}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {hotel.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {hotel.city} · {hotel.distanceToHaram} from Haram
                  </p>
                </div>
                <span className="badge badge-outline">{hotel.stars} stars</span>
              </div>
              <div className="mt-6">
                <p className="text-sm text-muted">Per night</p>
                <p className="text-3xl font-semibold text-brand-strong">
                  {hotel.currency} {hotel.nightlyRate}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
