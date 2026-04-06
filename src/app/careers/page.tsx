import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";

function renderParagraphs(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => (
      <p
        key={paragraph}
        className="text-sm leading-7 text-slate-600 sm:text-base"
      >
        {paragraph}
      </p>
    ));
}

function getEmailLabel(href: string) {
  return href.replace(/^mailto:/i, "").trim();
}

export default async function CareersPage() {
  const settings = await getStoredSitePagesSettings();
  const page = settings.careers;

  return (
    <main className="section-shell relative py-12 sm:py-16">
      <div className="pointer-events-none absolute -top-16 right-6 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-10 h-52 w-52 rounded-full bg-indigo-200/40 blur-3xl" />

      <section className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="pointer-events-none absolute -right-20 top-10 h-52 w-52 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-10 h-60 w-60 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {page.intro}
            </p>

            <div className="mt-6 space-y-5">{renderParagraphs(page.body)}</div>

            {page.ctaHref ? (
              <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Apply via email at{" "}
                <a
                  href={page.ctaHref}
                  className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700"
                >
                  {getEmailLabel(page.ctaHref)}
                </a>
              </div>
            ) : null}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="absolute -top-10 right-6 h-40 w-40 rounded-full bg-sky-200/60 blur-2xl" />
            <div className="absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-indigo-200/60 blur-2xl" />

            <div className="relative rounded-2xl bg-white p-4 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Hiring now
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                Join a team that values your growth
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Collaborative roles across travel ops, product, and customer
                success.
              </p>
            </div>

            <div className="relative mt-5 grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Team culture
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Mentorship
                    </p>
                    <p className="text-xs text-slate-500">
                      Weekly growth sessions
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    <span className="h-8 w-8 rounded-full border-2 border-white bg-sky-300" />
                    <span className="h-8 w-8 rounded-full border-2 border-white bg-emerald-300" />
                    <span className="h-8 w-8 rounded-full border-2 border-white bg-amber-300" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Candidate journey
                </p>
                <div className="mt-3 grid gap-2">
                  {["Apply online", "Talk to the team", "Get an offer"].map(
                    (step) => (
                      <div key={step} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                        <span className="text-sm text-slate-600">{step}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Open roles
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Opportunities for every stage
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {page.jobs.map((job, index) => (
            <article
              key={`${job.title}-${index}`}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {job.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {job.team}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {job.location}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {job.type}
                    </span>
                  </div>
                </div>
                {job.applyHref || page.ctaHref ? (
                  <p className="text-xs font-semibold text-slate-500">
                    Apply via email at{" "}
                    <a
                      href={job.applyHref || page.ctaHref}
                      className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700"
                    >
                      {getEmailLabel(job.applyHref || page.ctaHref)}
                    </a>
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {job.summary}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
