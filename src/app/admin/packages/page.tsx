import { featuredPackages } from "@/lib/mock-data";

export default function AdminPackagesPage() {
  return (
    <main className="section-shell flex-1 py-14">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="surface ring-soft rounded-[2rem] border border-white/80 p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-muted">
            Create Package
          </p>
          <h1 className="display-font mt-3 text-5xl text-brand-strong">
            Umrah package editor
          </h1>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <input
              className="input input-bordered rounded-2xl bg-white md:col-span-2"
              placeholder="Package title"
            />
            <input
              className="input input-bordered rounded-2xl bg-white"
              placeholder="Departure city"
            />
            <input
              className="input input-bordered rounded-2xl bg-white"
              placeholder="Base price"
            />
            <input
              className="input input-bordered rounded-2xl bg-white"
              placeholder="Start date"
            />
            <input
              className="input input-bordered rounded-2xl bg-white"
              placeholder="End date"
            />
            <input
              className="input input-bordered rounded-2xl bg-white"
              placeholder="Seats available"
            />
            <textarea
              className="textarea textarea-bordered min-h-32 rounded-2xl bg-white md:col-span-2"
              placeholder="Package description"
            />
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn btn-primary rounded-full px-6">
              Save draft
            </button>
            <button className="btn btn-outline rounded-full px-6">
              Publish later
            </button>
          </div>
        </section>

        <section className="surface ring-soft rounded-[2rem] border border-white/80 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted">
                Current Inventory
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">
                Package list
              </h2>
            </div>
            <span className="badge badge-primary badge-outline">
              {featuredPackages.length} packages
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {featuredPackages.map((item) => (
              <article
                key={item.slug}
                className="rounded-[1.5rem] border border-black/5 bg-white/80 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {item.departureCity} · {item.duration}
                    </p>
                  </div>
                  <span className="badge badge-outline">{item.status}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <strong className="text-brand-strong">
                    SAR {item.price}
                  </strong>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm rounded-full">
                      Edit
                    </button>
                    <button className="btn btn-ghost btn-sm rounded-full">
                      Archive
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
