import type { Metadata } from "next";

import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoredSitePagesSettings();
  const page = settings.aboutUs;

  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: "/about-us",
    keywords: ["about Safar Umrah", "travel company", "Umrah travel"],
  });
}

export default async function AboutUsPage() {
  const settings = await getStoredSitePagesSettings();
  const page = settings.aboutUs;

  return (
    <SiteContentPage
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      body={page.body}
      path="/about-us"
      ctaLabel={page.ctaLabel}
      ctaHref={page.ctaHref}
    />
  );
}
