import type { Metadata } from "next";

import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoredSitePagesSettings();
  const page = settings.termsConditions;

  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: "/terms-conditions",
    keywords: ["terms and conditions", "travel booking terms", "site terms"],
  });
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
