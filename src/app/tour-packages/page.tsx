import type { Metadata } from "next";

import { getPageBanner } from "@/lib/admin-settings/page-banner-settings";
import {
  buildStaticPageMetadata,
  getStaticPageSeo,
} from "@/lib/admin-settings/seo-settings";
import { TourPackagesClient } from "@/app/tour-packages/tour-packages-client";
import { StructuredData } from "@/components/shared/structured-data";
import { getActiveTourPackages } from "@/lib/tour-package-data";
import { getTourPackagePath } from "@/lib/tour-packages";
import {
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const packages = await getActiveTourPackages();
  // Only index the listing once it shows active packages.
  return buildStaticPageMetadata("tourPackages", {
    noIndex: packages.length === 0,
  });
}

export default async function TourPackagesPage() {
  const [packages, seo, heroImage] = await Promise.all([
    getActiveTourPackages(),
    getStaticPageSeo("tourPackages"),
    getPageBanner("tours"),
  ]);

  return (
    <>
      <StructuredData
        data={[
          createWebPageSchema({
            title: seo.title,
            description: seo.description,
            path: "/tour-packages",
            type: "CollectionPage",
          }),
          createItemListSchema(
            packages.map((pkg) => ({
              name: pkg.title,
              path: getTourPackagePath(pkg.slug),
            })),
            "Tour packages",
          ),
        ]}
      />
      <TourPackagesClient packages={packages} heroImage={heroImage} />
    </>
  );
}
