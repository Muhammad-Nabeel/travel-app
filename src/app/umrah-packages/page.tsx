import type { Metadata } from "next";

import {
  buildStaticPageMetadata,
  getStaticPageSeo,
} from "@/lib/admin-settings/seo-settings";
import { UmrahConfigurator } from "@/components/features/umrah/umrah-configurator";
import { StructuredData } from "@/components/shared/structured-data";
import {
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";
import {
  getPublishedUmrahPackages,
  getUmrahPackagePath,
} from "@/lib/umrah-packages";
import { toDuration, toStarRating } from "@/lib/umrah-pricing";

export async function generateMetadata(): Promise<Metadata> {
  const { isDummy } = await getPublishedUmrahPackages();
  // Only index the listing once it shows real, published packages.
  return buildStaticPageMetadata("umrahPackages", { noIndex: isDummy });
}

export default async function UmrahPackagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Restores a configuration carried back from a package page.
  const initial = {
    duration: toDuration(sp.nights),
    adults: Math.min(20, Math.max(1, Number(sp.adults) || 2)),
    children: Math.min(12, Math.max(0, Number(sp.children) || 0)),
    city: typeof sp.city === "string" ? sp.city : "All",
    makkahStars: toStarRating(sp.makkahStars),
    madinahStars: toStarRating(sp.madinahStars),
  };
  const [{ packages, isDummy }, seo] = await Promise.all([
    getPublishedUmrahPackages(),
    getStaticPageSeo("umrahPackages"),
  ]);

  return (
    <>
      <StructuredData
        data={[
          createWebPageSchema({
            title: seo.title,
            description: seo.description,
            path: "/umrah-packages",
            type: "CollectionPage",
          }),
          createItemListSchema(
            packages.map((pkg) => ({
              name: pkg.title,
              path: getUmrahPackagePath(pkg.slug),
            })),
            "Umrah packages",
          ),
        ]}
      />
      <UmrahConfigurator
        packages={packages}
        isDummy={isDummy}
        initial={initial}
      />
    </>
  );
}
