import type { Metadata } from "next";
import { connection } from "next/server";

import { StructuredData } from "@/components/shared/structured-data";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import {
  buildMetadata,
  createOrganizationSchema,
  createWebPageSchema,
} from "@/lib/seo";
import { Mail, MapPin, Phone } from "lucide-react";

function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function getTelHref(value: string): string {
  const digits = getPhoneDigits(value);
  if (!digits) return "#";
  return `tel:${value.trim().startsWith("+") ? "+" : ""}${digits}`;
}

export async function generateMetadata(): Promise<Metadata> {
  await connection();

  const pages = await getStoredSitePagesSettings();
  const page = pages.contactUs;

  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: "/contact-us",
    keywords: ["contact us", "travel support", "Safar Umrah contact"],
  });
}

export default async function ContactUsPage() {
  await connection();

  const pages = await getStoredSitePagesSettings();

  const page = pages.contactUs;

  return (
    <main className="section-shell py-12 sm:py-16">
      <StructuredData
        data={[
          createWebPageSchema({
            title: page.title,
            description: page.intro,
            path: "/contact-us",
            type: "ContactPage",
          }),
          createOrganizationSchema({
            telephone: page.phoneValue,
            email: page.emailValue,
            address: page.locationValue,
          }),
        ]}
      />

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          <div>
            {page.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                {page.eyebrow}
              </p>
            ) : null}

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-500 sm:text-lg">
              {page.intro}
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-medium text-slate-800">
                    {page.phoneLabel}
                  </p>
                  <a
                    href={getTelHref(page.phoneValue)}
                    className="mt-1 block text-xl font-semibold tracking-tight text-slate-950 transition hover:text-blue-600"
                  >
                    {page.phoneValue}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-medium text-slate-800">
                    {page.locationLabel}
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                    {page.locationValue}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-medium text-slate-800">
                    {page.emailLabel}
                  </p>
                  <a
                    href={`mailto:${page.emailValue}`}
                    className="mt-1 block text-xl font-semibold tracking-tight text-slate-950 transition hover:text-blue-600"
                  >
                    {page.emailValue}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <form className="grid gap-6" action="#">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-base font-medium text-slate-900">
                    {page.fullNameLabel}
                  </span>
                  <input
                    type="text"
                    placeholder={page.fullNamePlaceholder}
                    className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-base font-medium text-slate-900">
                    {page.emailFieldLabel}
                  </span>
                  <input
                    type="email"
                    placeholder={page.emailFieldPlaceholder}
                    className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-base font-medium text-slate-900">
                  {page.messageLabel}
                </span>
                <textarea
                  placeholder={page.messagePlaceholder}
                  className="min-h-40 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                />
              </label>

              <button
                type="button"
                className="inline-flex h-14 items-center justify-center rounded-xl bg-[#1f57ae] px-6 text-lg font-semibold text-white transition hover:bg-[#194896]"
              >
                {page.submitLabel}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
