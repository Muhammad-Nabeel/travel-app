import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { StructuredData } from "@/components/shared/structured-data";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import { getActiveJobOpenings } from "@/lib/job-openings";
import { createItemListSchema, createWebPageSchema } from "@/lib/seo";

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

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("careers");
}

export default async function CareersPage() {
  const [settings, jobs] = await Promise.all([
    getStoredSitePagesSettings(),
    getActiveJobOpenings(),
  ]);
  const page = settings.careers;

  return (
    <div className="section-shell relative py-12 sm:py-16">
      <StructuredData
        data={[
          createWebPageSchema({
            title: page.title,
            description: page.intro,
            path: "/careers",
          }),
          ...(jobs.length > 0
            ? [
                createItemListSchema(
                  jobs.map((job) => ({
                    name: job.title,
                    path: "/careers",
                  })),
                  "Open travel roles",
                ),
              ]
            : []),
        ]}
      />

      <div className="pointer-events-none absolute -top-16 right-6 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-10 h-52 w-52 rounded-full bg-indigo-200/40 blur-3xl" />

      <section className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="pointer-events-none absolute -right-20 top-10 h-52 w-52 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-10 h-60 w-60 rounded-full bg-indigo-100/60 blur-3xl" />
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

        {jobs.length > 0 ? (
          <>
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
              {jobs.map((job) => (
                <article
                  key={job.id}
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
                          {job.employmentType}
                        </span>
                      </div>
                    </div>
                    {page.ctaHref ? (
                      <p className="text-xs font-semibold text-slate-500">
                        Apply via email at{" "}
                        <a
                          href={page.ctaHref}
                          className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700"
                        >
                          {getEmailLabel(page.ctaHref)}
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
          </>
        ) : null}
      </section>
    </div>
  );
}
