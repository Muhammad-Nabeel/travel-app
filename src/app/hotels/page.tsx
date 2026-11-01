import type { Metadata } from "next";
import { BedDouble } from "lucide-react";

import { getPageBanner } from "@/lib/admin-settings/page-banner-settings";
import { buildStaticPageMetadata } from "@/lib/admin-settings/seo-settings";
import { CATALOG_INDEXING } from "@/lib/seo-copy";
import { ActivitiesSlider } from "@/components/features/home/activities-slider";
import { BlogSlider } from "@/components/features/home/blog-slider";
import { DestinationsSlider } from "@/components/features/home/destinations-slider";
import { HotelSearchEngine } from "@/components/features/home/hotel-search/hotel-search";
import { MobileSearchToggle } from "@/components/features/flights/mobile-search-toggle";
import { HotelEnquiryForm } from "@/components/features/hotels/hotel-enquiry-form";
import { StructuredData } from "@/components/shared/structured-data";
import { buildMetadata, createWebPageSchema } from "@/lib/seo";
import { hotelSearchSchema } from "@/lib/validations/search";

type HotelsPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: HotelsPageProps): Promise<Metadata> {
  const params = (await searchParams) ?? {};

  if (!params.destination) {
    return buildStaticPageMetadata("hotels", {
      noIndex: !CATALOG_INDEXING.hotels,
    });
  }

  // Search result URLs are per-user and infinite; never index them.
  return buildMetadata({
    title: `Hotels in ${params.destination}`,
    description:
      "Request hotel rates for your dates and our travel team will get back to you.",
    path: "/hotels",
    noIndex: true,
  });
}

export default async function HotelsPage({ searchParams }: HotelsPageProps) {
  const params = (await searchParams) ?? {};

  // Until a hotel provider is connected, a search takes a rate request (like
  // flights with Sabre switched off) instead of listing hotels.
  if (params.destination) {
    const result = hotelSearchSchema.safeParse(params);

    if (!result.success) {
      return (
        <div className="section-shell flex-1 py-10">
          <div className="alert alert-error bg-red-50 text-red-900">
            <span>
              Hotel search is invalid. Please review the destination, dates and
              guest details.
            </span>
          </div>
        </div>
      );
    }

    const query = result.data;
    return (
      <div className="flex-1 py-6">
        <MobileSearchToggle
          label="Hotel search"
          summary={`${query.destination} · ${query.checkIn} → ${query.checkOut}`}
        >
          <HotelSearchEngine variant="embedded" initialValues={query} />
        </MobileSearchToggle>
        <HotelEnquiryForm query={query} />
      </div>
    );
  }

  const heroImage = await getPageBanner("hotels");

  return (
    <div className="flex-1">
      <StructuredData
        data={createWebPageSchema({
          title: "Hotels",
          description:
            "Search and compare hotel stays for religious and leisure travel plans.",
          path: "/hotels",
          type: "CollectionPage",
        })}
      />

      {/* Hero search */}
      <HotelSearchEngine heroImage={heroImage} />

      {/* Hotel inventory isn't connected yet, so there is nothing to list. */}
      <section className="section-shell py-10" aria-label="Hotels">
        <div className="rounded-2xl border border-line bg-subtle px-6 py-16 text-center">
          <BedDouble className="mx-auto mb-4 size-10 text-muted" />
          <p className="text-lg font-semibold text-foreground">
            No hotels found
          </p>
          <p className="mt-1 text-sm text-muted">
            We don&apos;t have any hotels to show right now. Please check back soon.
          </p>
        </div>
      </section>

      <DestinationsSlider />
      <ActivitiesSlider />
      <BlogSlider />
    </div>
  );
}
