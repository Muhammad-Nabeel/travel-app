import type { Metadata } from "next";

import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoredSitePagesSettings();
  const page = settings.privacyPolicy;

  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: "/privacy-policy",
    keywords: ["privacy policy", "data protection", "travel website policy"],
  });
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
