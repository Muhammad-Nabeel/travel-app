import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { AirlinesSlider } from "@/components/features/home/airlines-slider";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { CustomerReviewsSection } from "@/components/features/home/customer-reviews-section";

export default function Home() {
  return (
    <main className="flex-1">
      <FlightSearchEngine />

      <AirlinesSlider />

      <DestinationsSlider />

      <ActivitiesSlider />

      <BlogSlider />

      <CustomerReviewsSection />
    </main>
  );
}
