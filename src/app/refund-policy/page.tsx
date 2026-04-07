import type { Metadata } from "next";

import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoredSitePagesSettings();
  const page = settings.refundPolicy;

  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: "/refund-policy",
    keywords: ["refund policy", "cancellations", "travel booking refunds"],
  });
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
