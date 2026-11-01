import type { Metadata } from "next";

import {
  buildOrganizationJsonLd,
  buildStaticPageMetadata,
} from "@/lib/admin-settings/seo-settings";
import { StructuredData } from "@/components/shared/structured-data";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import {
  getPrimaryPhone,
  getStoredSupportContactSettings,
} from "@/lib/admin-settings/support-contact-settings";
import { createWebPageSchema } from "@/lib/seo";
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
  return buildStaticPageMetadata("contactUs");
}

export default async function ContactUsPage() {
  const [pages, contact, organizationJsonLd] = await Promise.all([
    getStoredSitePagesSettings(),
    getStoredSupportContactSettings(),
    buildOrganizationJsonLd(),
  ]);

  const page = pages.contactUs;
  const phone = getPrimaryPhone(contact);

  return (
    <div className="section-shell py-12 sm:py-16">
      <StructuredData
        data={[
          createWebPageSchema({
            title: page.title,
            description: page.intro,
            path: "/contact-us",
            type: "ContactPage",
          }),
          organizationJsonLd,
        ]}
      />

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div>
          <div className="min-w-0">
            {page.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-strong">
                {page.eyebrow}
              </p>
            ) : null}

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-500 sm:text-lg">
              {page.intro}
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {phone ? (
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                    <Phone className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-medium text-slate-800">
                      {page.phoneLabel}
                    </p>
                    <a
                      href={getTelHref(phone)}
                      className="mt-1 block text-xl font-semibold tracking-tight text-slate-950 transition hover:text-brand"
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              ) : null}

              {contact.address ? (
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                    <MapPin className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-medium text-slate-800">
                      {page.locationLabel}
                    </p>
                    <p className="mt-1 break-words text-xl font-semibold tracking-tight text-slate-950">
                      {contact.address}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                  <Mail className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-medium text-slate-800">
                    {page.emailLabel}
                  </p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-1 block break-all text-lg font-semibold tracking-tight text-slate-950 transition hover:text-brand sm:text-xl"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
