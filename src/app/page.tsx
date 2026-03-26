import Link from "next/link";
import { ArrowRight, Building2, PlaneTakeoff, ShieldCheck } from "lucide-react";

import { featuredPackages } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="flex-1 pb-20">
      <section className="hero-grid border-b border-black/5">
        <div className="section-shell py-6">
          <div className="navbar rounded-full border border-black/5 bg-white/70 px-4 shadow-sm backdrop-blur">
            <div className="flex-1">
              <Link
                href="/"
                className="display-font text-3xl font-semibold tracking-wide text-brand-strong"
              >
                Safar Umrah
              </Link>
            </div>
            <div className="flex gap-2">
              <Link href="/flights" className="btn btn-ghost btn-sm">
                Flights
              </Link>
              <Link href="/hotels" className="btn btn-ghost btn-sm">
                Hotels
              </Link>
              <Link href="/umrah-packages" className="btn btn-ghost btn-sm">
                Packages
              </Link>
              <Link href="/admin" className="btn btn-primary btn-sm">
                Admin
              </Link>
            </div>
          </div>

          <div className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <div className="badge badge-secondary badge-outline px-4 py-4 text-xs uppercase tracking-[0.32em]">
                Sabre + Amadeus Ready Foundation
              </div>
              <div className="space-y-5">
                <h1 className="display-font max-w-4xl text-6xl leading-none text-brand-strong sm:text-7xl">
                  Flights, hotels, and Umrah packages managed from one platform.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted">
                  This starter implementation gives you a branded public site,
                  admin package flow, Prisma data model, and placeholder flight
                  and hotel search APIs ready to be wired to Sabre and Amadeus.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/umrah-packages"
                  className="btn btn-primary btn-lg rounded-full px-7"
                >
                  View Packages
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/admin/packages"
                  className="btn btn-outline btn-lg rounded-full px-7"
                >
                  Open Admin Section
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <article className="surface ring-soft rounded-3xl border border-white/70 p-5">
                  <PlaneTakeoff className="mb-4 size-5 text-brand" />
                  <h2 className="font-semibold">Flight Search</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Normalized search flow ready for Sabre and Amadeus adapters.
                  </p>
                </article>
                <article className="surface ring-soft rounded-3xl border border-white/70 p-5">
                  <Building2 className="mb-4 size-5 text-accent" />
                  <h2 className="font-semibold">Hotel Search</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Hotel availability pages and API boundaries prepared for
                    provider wiring.
                  </p>
                </article>
                <article className="surface ring-soft rounded-3xl border border-white/70 p-5">
                  <ShieldCheck className="mb-4 size-5 text-brand-strong" />
                  <h2 className="font-semibold">Admin Packages</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Admin-managed Umrah inventory with pricing, schedules, and
                    publish state.
                  </p>
                </article>
              </div>
            </div>

            <div className="surface ring-soft rounded-[2rem] border border-white/80 p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-muted">
                    Implementation Snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-brand-strong">
                    Phase 1 modules
                  </h2>
                </div>
                <span className="badge badge-primary badge-outline">MVP</span>
              </div>
              <div className="space-y-4 text-sm leading-7 text-muted">
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="font-semibold text-foreground">Stack</p>
                  <p>
                    Next.js App Router, TypeScript, Tailwind CSS v4, DaisyUI,
                    Prisma ORM, MySQL.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="font-semibold text-foreground">Domain areas</p>
                  <p>
                    Flights, hotels, bookings, public package browsing, and
                    admin package management.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="font-semibold text-foreground">
                    Provider strategy
                  </p>
                  <p>
                    Search endpoints currently return normalized placeholder
                    data and are ready for adapter-based provider integration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted">
              Admin-Curated Packages
            </p>
            <h2 className="display-font mt-3 text-5xl text-brand-strong">
              Featured Umrah inventory
            </h2>
          </div>
          <Link href="/umrah-packages" className="btn btn-ghost rounded-full">
            Browse all
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {featuredPackages.map((item) => (
            <article
              key={item.slug}
              className="surface ring-soft rounded-[2rem] border border-white/80 p-6"
            >
              <div className="flex items-center justify-between text-sm text-muted">
                <span>{item.departureCity}</span>
                <span className="badge badge-outline">{item.status}</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-brand-strong">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted">
                {item.description}
              </p>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted">Starting from</p>
                  <p className="text-3xl font-semibold text-foreground">
                    SAR {item.price}
                  </p>
                </div>
                <p className="text-sm font-medium text-brand">
                  {item.duration}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
