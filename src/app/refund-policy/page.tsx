import { SiteContentPage } from "@/components/shared/site-content-page";
import { getStoredSitePagesSettings } from "@/lib/admin-settings/site-pages-settings";

export default async function RefundPolicyPage() {
  const settings = await getStoredSitePagesSettings();
  const page = settings.refundPolicy;

  return (
    <SiteContentPage
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      body={page.body}
      ctaLabel={page.ctaLabel}
      ctaHref={page.ctaHref}
    />
  );
}
