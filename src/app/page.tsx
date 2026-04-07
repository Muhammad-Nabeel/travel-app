import type { Metadata } from "next";

import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { AirlinesSlider } from "@/components/features/home/airlines-slider";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { CustomerReviewsSection } from "@/components/features/home/customer-reviews-section";
import { StructuredData } from "@/components/shared/structured-data";
import {
  buildMetadata,
  createOrganizationSchema,
  createWebPageSchema,
  createWebsiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Flights, Umrah Packages and Travel Planning",
  description:
    "Search flights, discover destinations, compare activities, and plan Umrah travel from a cleaner booking and content experience.",
  path: "/",
  keywords: [
    "flight search",
    "Umrah travel",
    "travel planning",
    "destinations",
    "travel activities",
  ],
});

export default function Home() {
  return (
    <main className="flex-1">
      <StructuredData
        data={[
          createWebPageSchema({
            title: "Flights, Umrah Packages and Travel Planning",
            description:
              "Search flights, discover destinations, compare activities, and plan Umrah travel from a cleaner booking and content experience.",
            path: "/",
          }),
          createWebsiteSchema(),
          createOrganizationSchema(),
        ]}
      />

      <FlightSearchEngine />

      <AirlinesSlider />

      <DestinationsSlider />

      <ActivitiesSlider />

      <BlogSlider />

      <CustomerReviewsSection />
    </main>
  );
}
