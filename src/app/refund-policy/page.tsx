import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("refundPolicy");
}

export default async function RefundPolicyPage() {
  const settings = await getStoredSitePagesSettings();
  const page = settings.refundPolicy;

  return (
    <SiteContentPage
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      body={page.body}
      path="/refund-policy"
      ctaLabel={page.ctaLabel}
      ctaHref={page.ctaHref}
    />
  );
}
