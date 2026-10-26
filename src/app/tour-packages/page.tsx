import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { CATALOG_INDEXING } from "@/lib/seo-copy";
import { TourPackagesClient } from "@/app/tour-packages/tour-packages-client";
import { StructuredData } from "@/components/shared/structured-data";
import { tourPackageResults } from "@/lib/mock-data";
import { getTourPackagePath } from "@/lib/tour-packages";
import {
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("tourPackages", {
    noIndex: !CATALOG_INDEXING.tourPackages,
  });
}

export default function TourPackagesPage() {
  return (
    <>
      <StructuredData
        data={[
          createWebPageSchema({
            title: "Tour Packages",
            description:
              "Browse featured tour packages and compare durations, prices, and highlights before you enquire.",
            path: "/tour-packages",
            type: "CollectionPage",
          }),
          createItemListSchema(
            tourPackageResults.map((pkg) => ({
              name: pkg.title,
              path: getTourPackagePath(pkg.title),
            })),
            "Tour packages",
          ),
        ]}
      />
      <TourPackagesClient />
    </>
  );
}
