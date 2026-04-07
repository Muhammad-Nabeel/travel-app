import type { Metadata } from "next";
import Link from "next/link";

import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import { getStoredSupportContactSettings } from "@/lib/admin-settings/support-contact-settings";
import { buildMetadata } from "@/lib/seo";

function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function getTelHref(value: string): string {
  const digits = getPhoneDigits(value);
  if (!digits) return "#";
  return `tel:${value.trim().startsWith("+") ? "+" : ""}${digits}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoredSitePagesSettings();
  const page = settings.arrangeCall;

  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: "/arrange-a-call",
    keywords: ["travel consultation", "call back", "Umrah support"],
  });
}

export default async function ArrangeCallPage() {
  const [pages, support] = await Promise.all([
    getStoredSitePagesSettings(),
    getStoredSupportContactSettings(),
  ]);

  const page = pages.arrangeCall;
  const preferredNumber =
    support.mobileNumber.trim() || support.landlineNumber.trim();
  const ctaHref =
    page.ctaHref === "tel:" && preferredNumber
      ? getTelHref(preferredNumber)
      : page.ctaHref;

  return (
    <SiteContentPage
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      body={page.body}
      path="/arrange-a-call"
      ctaLabel={page.ctaLabel}
      ctaHref={ctaHref}
      aside={
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Arrange your call
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Encourage travellers to call during your preferred support hours or
            reach out on the saved support line.
          </p>
          {preferredNumber ? (
            <Link
              href={getTelHref(preferredNumber)}
              className="mt-4 block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Preferred call line
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {preferredNumber}
              </p>
            </Link>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
              Add a support number in admin settings to activate a direct call
              CTA.
            </p>
          )}
        </div>
      }
    />
  );
}
