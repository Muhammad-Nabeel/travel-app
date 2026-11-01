import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("privacyPolicy");
}

export default async function PrivacyPolicyPage() {
  const settings = await getStoredSitePagesSettings();
  const page = settings.privacyPolicy;

  return (
    <SiteContentPage
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      body={page.body}
      path="/privacy-policy"
      ctaLabel={page.ctaLabel}
      ctaHref={page.ctaHref}
    />
  );
}
