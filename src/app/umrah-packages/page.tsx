import type { Metadata } from "next";
import { headers } from "next/headers";

import type { PackageRow } from "@/app/api/packages/route";
import { UmrahConfigurator } from "@/components/features/umrah/umrah-configurator";
import { StructuredData } from "@/components/shared/structured-data";
import {
  buildMetadata,
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Umrah Packages",
  description:
    "Compare available Umrah packages, departures, inclusions, and pricing before you book.",
  path: "/umrah-packages",
  keywords: ["Umrah packages", "pilgrimage travel", "Umrah booking"],
});

async function getPackages(): Promise<{
  packages: PackageRow[];
  isDummy: boolean;
}> {
  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const res = await fetch(`${protocol}://${host}/api/packages?all=true`, {
      cache: "no-store",
    });
    const isDummy = res.headers.get("x-package-source") === "dummy";
    const data = await res.json();
    return { packages: Array.isArray(data) ? data : [], isDummy };
  } catch {
    return { packages: [], isDummy: true };
  }
}

export default async function UmrahPackagesPage() {
  const { packages, isDummy } = await getPackages();

  return (
    <>
      <StructuredData
        data={[
          createWebPageSchema({
            title: "Umrah Packages",
            description:
              "Compare available Umrah packages, departures, inclusions, and pricing before you book.",
            path: "/umrah-packages",
            type: "CollectionPage",
          }),
          createItemListSchema(
            packages.map((pkg) => ({
              name: pkg.title,
              path: "/umrah-packages",
            })),
            "Umrah packages",
          ),
        ]}
      />
      <UmrahConfigurator packages={packages} isDummy={isDummy} />
    </>
  );
}
