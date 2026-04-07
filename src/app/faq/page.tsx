import type { Metadata } from "next";

import { StructuredData } from "@/components/shared/structured-data";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import { buildMetadata, createFAQSchema, createWebPageSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoredSitePagesSettings();
  const page = settings.faq;

  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: "/faq",
    keywords: ["FAQ", "travel questions", "Umrah help"],
  });
}

export default async function FaqPage() {
  const settings = await getStoredSitePagesSettings();
  const page = settings.faq;

  return (
    <main className="section-shell py-12 sm:py-16">
      <StructuredData
        data={[
          createWebPageSchema({
            title: page.title,
            description: page.intro,
            path: "/faq",
          }),
          createFAQSchema(page.faqs),
        ]}
      />

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
          {page.eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {page.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {page.intro}
        </p>

        <div className="mt-10 space-y-4">
          {page.faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-900">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
