import { ShieldCheck, Sparkles, WalletCards } from "lucide-react";

import { AirportSearchCard } from "@/components/airport-search-card";
import { topDestinations, travelPartners } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="flex-1 bg-slate-100 text-slate-900">
      <section className="home-hero pb-14 pt-7">
        <div className="section-shell">
          <div className="mb-10 flex items-center justify-between">
            <div className="text-3xl font-bold tracking-tight text-white">
              safar
            </div>
            <div className="hidden items-center gap-3 text-xs font-semibold text-white/90 sm:flex">
              <span>EN</span>
              <span className="rounded-full border border-white/40 px-3 py-1">
                Support
              </span>
              <span className="rounded-full border border-white/40 px-3 py-1">
                My Trips
              </span>
              <span className="rounded-full bg-white px-4 py-1 text-slate-900">
                Login
              </span>
            </div>
          </div>

          <div className="mx-auto max-w-4xl text-center text-white">
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              One simple search for flights and Umrah journeys
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
              Type a city name to search airports from a public dataset API and
              jump directly into your flights flow.
            </p>
            <div className="mt-7">
              <AirportSearchCard />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="section-shell text-center">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Trusted by 83 million+ travellers worldwide
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-2xl font-bold">4.7</p>
              <p className="text-sm text-slate-500">230,575+ reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold">4.6</p>
              <p className="text-sm text-slate-500">91,002+ reviews</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="section-shell">
          <h2 className="text-center text-xl font-semibold text-slate-800 sm:text-2xl">
            700+ travel websites. One simple search
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-500">
            {travelPartners.map((partner) => (
              <span
                key={partner}
                className="rounded-full bg-white px-4 py-2 shadow-sm"
              >
                {partner}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <Sparkles className="mb-3 size-5 text-lime-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Best flight deals in one place
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Compare routes quickly with city-based airport suggestions.
              </p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <WalletCards className="mb-3 size-5 text-sky-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Flexible ways to pay
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Prepare your flow for package deposits and installment options.
              </p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <ShieldCheck className="mb-3 size-5 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Support available 24/7
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Admin and operations panels are ready for next phase
                integration.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="section-shell">
          <h2 className="mb-5 text-center text-xl font-semibold text-slate-800 sm:text-2xl">
            Top searched destinations from Karachi
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {topDestinations.map((destination) => (
              <article
                key={destination.city}
                className="destination-tile relative overflow-hidden rounded-xl p-4 text-white"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative">
                  <h3 className="text-lg font-semibold">{destination.city}</h3>
                  <p className="mt-8 text-xs text-white/85">
                    {destination.notes}
                  </p>
                  <p className="text-sm font-bold">{destination.fare}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
