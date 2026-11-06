import Link from "next/link";
import { ArrowRight, Plane } from "lucide-react";

import { BrandIcon } from "@/components/shared/brand-icon";
import { SectionHeader } from "@/components/shared/section-header";
import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import { getActiveFlightRoutes } from "@/lib/flight-routes";
import { getFlightRoutePath } from "@/lib/validations/flight-route";

/** Links every active route page from /flights so they are crawlable. */
export async function PopularFlightRoutes() {
  const [routes, brand] = await Promise.all([
    getActiveFlightRoutes(),
    getStoredBrandSettings(),
  ]);
  if (routes.length === 0) return null;

  return (
    <section className="section-shell py-6 md:py-8" aria-label="Popular flight routes">
      <SectionHeader
        title="Popular flight routes from Pakistan"
        subtitle="Airlines, flight times and tips for the routes our customers book most."
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {routes.map((route) => (
          <li key={route.id}>
            <Link
              href={getFlightRoutePath(route.slug)}
              className="group flex h-full flex-col justify-between gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-brand hover:shadow-card"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <BrandIcon src={brand.assets.flights} fallback={Plane} size={28} />
                {route.originIata} → {route.destinationIata}
              </span>
              <span className="text-base font-semibold text-foreground group-hover:text-brand">
                {route.originCity} to {route.destinationCity} flights
              </span>
              <span className="flex items-center justify-between text-sm text-muted">
                <span>{route.fareFrom ? `From ${route.fareFrom}` : route.flightTime}</span>
                <ArrowRight className="size-4 shrink-0" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
