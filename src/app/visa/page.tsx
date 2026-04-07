import type { Metadata } from "next";

import { StructuredData } from "@/components/shared/structured-data";
import { VisaResults } from "@/components/features/visa/visa-results";
import { getStoredVisaCountries } from "@/lib/admin-settings/visa-settings";
import {
  buildMetadata,
  createItemListSchema,
  createWebPageSchema,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Visa Guidance",
  description:
    "Review destination-specific visa guidance and planning details before you travel.",
  path: "/visa",
  keywords: ["visa guidance", "travel visa", "visa requirements"],
});

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
    <main className="flex-1">
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
              path: "/visa",
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
    </main>
  );
}
