import { PlaneTakeoff } from "lucide-react";

import { flightResults } from "@/lib/mock-data";

type FlightsPageProps = {
  searchParams?: Promise<{
    origin?: string;
    destination?: string;
    originCity?: string;
    destinationCity?: string;
  }>;
};

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const params = await searchParams;
  const origin = params?.origin ?? "LHE";
  const destination = params?.destination ?? "JED";

  return (
    <main className="section-shell flex-1 py-14">
      <div className="surface ring-soft rounded-[2rem] border border-white/80 p-8">
        <div className="flex items-center gap-3">
          <PlaneTakeoff className="size-6 text-brand" />
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">
              Flights
            </p>
            <h1 className="display-font text-5xl text-brand-strong">
              Flight search foundation
            </h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <label className="form-control">
            <span className="label-text mb-2 text-sm text-muted">Origin</span>
            <input
              className="input input-bordered rounded-2xl bg-white"
              defaultValue={origin}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 text-sm text-muted">
              Destination
            </span>
            <input
              className="input input-bordered rounded-2xl bg-white"
              defaultValue={destination}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 text-sm text-muted">
              Departure date
            </span>
            <input
              className="input input-bordered rounded-2xl bg-white"
              defaultValue="2026-04-12"
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 text-sm text-muted">Adults</span>
            <input
              className="input input-bordered rounded-2xl bg-white"
              defaultValue="1"
            />
          </label>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted">
          Showing the selected route from the homepage airport search. Next step
          is wiring live fares from Sabre and Amadeus adapters.
        </p>

        <div className="mt-8 space-y-4">
          {flightResults.map((flight) => (
            <article
              key={flight.id}
              className="rounded-[1.5rem] border border-black/5 bg-white/80 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-muted">
                    {flight.provider}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {flight.airline}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {flight.origin} to {flight.destination} · {flight.cabin}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Sample fare</p>
                  <p className="text-3xl font-semibold text-brand-strong">
                    {flight.currency} {flight.price}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
