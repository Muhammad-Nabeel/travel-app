import Link from "next/link";
import type { ReactNode } from "react";

import { StructuredData } from "@/components/shared/structured-data";
import { createWebPageSchema } from "@/lib/seo";

type SiteContentPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  path: string;
  ctaLabel?: string;
  ctaHref?: string;
  aside?: ReactNode;
};

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

export function SiteContentPage({
  eyebrow,
  title,
  intro,
  body,
  path,
  ctaLabel,
  ctaHref,
  aside,
}: SiteContentPageProps) {
  return (
    <main className="section-shell py-12 sm:py-16">
      <StructuredData
        data={createWebPageSchema({
          title,
          description: intro,
          path,
        })}
      />

      <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
          {eyebrow}
        </p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_20rem] lg:items-start">
          <div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {intro}
            </p>

            <div className="mt-8 space-y-5">{renderParagraphs(body)}</div>

            {ctaLabel && ctaHref ? (
              <div className="mt-8">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {ctaLabel}
                </Link>
              </div>
            ) : null}
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            {aside ?? (
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Need help now?
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use the admin section to customise the side content for this
                  page, or direct visitors to the next step with a CTA.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
