import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("termsConditions");
}

export default async function TermsConditionsPage() {
  const settings = await getStoredSitePagesSettings();
  const page = settings.termsConditions;

  return (
    <SiteContentPage
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      body={page.body}
      path="/terms-conditions"
      ctaLabel={page.ctaLabel}
      ctaHref={page.ctaHref}
    />
  );
}
