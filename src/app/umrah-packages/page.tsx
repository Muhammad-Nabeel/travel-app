import { featuredPackages } from "@/lib/mock-data";

export default function UmrahPackagesPage() {
  return (
    <main className="section-shell flex-1 py-14">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">
          Umrah Packages
        </p>
        <h1 className="display-font mt-3 text-6xl text-brand-strong">
          Admin-curated journeys
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          These cards reflect the package structure already modeled in Prisma.
          The next implementation step is replacing the mock source with real
          database queries.
        </p>
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
            <h2 className="mt-5 text-2xl font-semibold text-brand-strong">
              {item.title}
            </h2>
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
              <p className="text-sm font-medium text-brand">{item.duration}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
