import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="section-shell flex-1 py-14">
      <div className="surface ring-soft rounded-4xl border border-white/80 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">Admin</p>
        <h1 className="display-font mt-3 text-5xl text-brand-strong">
          Operations hub
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          This first pass focuses on package inventory management. Flight and
          hotel provider credentials, logs, and booking oversight can be added
          as dedicated admin modules next.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/packages"
            className="rounded-3xl border border-black/5 bg-white/80 p-6 transition hover:-translate-y-0.5"
          >
            <h2 className="text-xl font-semibold text-foreground">
              Manage Umrah packages
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Create, draft, publish, and archive package inventory.
            </p>
          </Link>
          <Link
            href="/admin/destinations"
            className="rounded-3xl border border-black/5 bg-white/80 p-6 transition hover:-translate-y-0.5"
          >
            <h2 className="text-xl font-semibold text-foreground">
              Popular Destinations
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Add, edit, and reorder destination cards shown in the homepage
              slider.
            </p>
          </Link>
          <Link
            href="/admin/activities"
            className="rounded-3xl border border-black/5 bg-white/80 p-6 transition hover:-translate-y-0.5"
          >
            <h2 className="text-xl font-semibold text-foreground">
              Trending Activities
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Create, edit, and manage trending activities linked to
              destinations.
            </p>
          </Link>
          <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Provider configuration
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Reserved for Sabre and Amadeus credentials, usage monitoring, and
              fallback controls.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
