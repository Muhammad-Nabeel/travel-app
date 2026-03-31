import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { FlightSearchEngine } from "@/components/features/home/flight-search/flight-search";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { CustomerSupport } from "@/components/shared/customer-support";

export default function Home() {
  return (
    <main className="flex-1">
      <FlightSearchEngine />

      <CustomerSupport />

      <DestinationsSlider />

      <ActivitiesSlider />

      <BlogSlider />
    </main>
  );
}
