import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { StructuredData } from "@/components/shared/structured-data";
import { VisaResults } from "@/components/features/visa/visa-results";
import { getStoredVisaCountries } from "@/lib/admin-settings/visa-settings";
import {
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";
import { getVisaPath } from "@/lib/visa";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("visa");
}

export default async function VisaPage() {
  const visaResults = await getStoredVisaCountries();
  const activeResults = visaResults
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const countryOptions = Array.from(
    new Set(activeResults.map((item) => item.country)),
  );
  const popularCountries = countryOptions.slice(0, 6);

  return (
    <div className="flex-1">
      <StructuredData
        data={[
          createWebPageSchema({
            title: "Visa Guidance",
            description:
              "Review destination-specific visa guidance and planning details before you travel.",
            path: "/visa",
            type: "CollectionPage",
          }),
          createItemListSchema(
            activeResults.map((item) => ({
              name: item.country,
              path: getVisaPath(item.country, item.visaType),
            })),
            "Visa guidance countries",
          ),
        ]}
      />

      <VisaResults
        results={activeResults}
        countryOptions={countryOptions}
        popularCountries={popularCountries}
      />
    </div>
  );
}
