import type { Metadata } from "next";

import { TourPackagesClient } from "@/app/tour-packages/tour-packages-client";
import { StructuredData } from "@/components/shared/structured-data";
import { tourPackageResults } from "@/lib/mock-data";
import {
  buildMetadata,
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Tour Packages",
  description:
    "Browse featured tour packages and compare durations, prices, and highlights before you enquire.",
  path: "/tour-packages",
  keywords: ["tour packages", "holiday packages", "group tours"],
});

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
              path: "/tour-packages",
            })),
            "Tour packages",
          ),
        ]}
      />
      <TourPackagesClient />
    </>
  );
}
