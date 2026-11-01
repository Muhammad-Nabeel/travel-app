import type { Metadata } from "next";

import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { AirlinesSlider } from "@/components/features/home/airlines-slider";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { CustomerReviewsSection } from "@/components/features/home/customer-reviews-section";
import { PromoBanner } from "@/components/features/home/promo-banner";
import { WhyBookSection } from "@/components/features/home/why-book-section";
import { StructuredData } from "@/components/shared/structured-data";
import {
  buildOrganizationJsonLd,
  buildStaticPageMetadata,
  getStaticPageSeo,
} from "@/lib/admin-settings/seo-settings";
import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import { getPageBanner } from "@/lib/admin-settings/page-banner-settings";
import {
  getPrimaryPhone,
  getStoredSupportContactSettings,
} from "@/lib/admin-settings/support-contact-settings";
import { createWebPageSchema, createWebsiteSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("home");
}

export default async function Home() {
  const [seo, organizationJsonLd, heroImage, contact, brand] =
    await Promise.all([
      getStaticPageSeo("home"),
      buildOrganizationJsonLd(),
      getPageBanner("home"),
      getStoredSupportContactSettings(),
      getStoredBrandSettings(),
    ]);

  return (
    <div className="flex-1">
      <StructuredData
        data={[
          createWebPageSchema({
            title: seo.title,
            description: seo.description,
            path: "/",
          }),
          createWebsiteSchema(seo.siteName),
          organizationJsonLd,
        ]}
      />

      <FlightSearchEngine heroImage={heroImage} />

      <WhyBookSection
        brandName={seo.siteName}
        phone={getPrimaryPhone(contact)}
        assets={brand.assets}
      />

      <AirlinesSlider />

      <DestinationsSlider />

      <PromoBanner />

      <ActivitiesSlider />

      <CustomerReviewsSection />

      <BlogSlider />
    </div>
  );
}
