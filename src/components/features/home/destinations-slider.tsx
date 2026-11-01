import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CardCarousel } from "@/components/shared/card-carousel";
import { getActiveDestinations } from "@/lib/home-sections";

type Destination = Awaited<ReturnType<typeof getActiveDestinations>>[number];

const GRADIENTS: Record<string, string> = {
  blue: "linear-gradient(130deg, #274c77 0%, #6096ba 45%, #a3cef1 100%)",
  dark: "linear-gradient(130deg, #2b2d42 0%, #8d99ae 45%, #edf2f4 100%)",
  ocean: "linear-gradient(130deg, #003049 0%, #669bbc 45%, #eae2b7 100%)",
  purple: "linear-gradient(130deg, #4a4e69 0%, #9a8c98 45%, #c9ada7 100%)",
  teal: "linear-gradient(130deg, #005f73 0%, #0a9396 45%, #94d2bd 100%)",
  sunset: "linear-gradient(130deg, #9d0208 0%, #dc2f02 45%, #f48c06 100%)",
  navy: "linear-gradient(130deg, #14213d 0%, #3a506b 45%, #5bc0be 100%)",
};

export async function DestinationsSlider() {
  const destinations = await getActiveDestinations();
  const domestic = destinations.filter((d) => d.scope === "DOMESTIC");
  const international = destinations.filter((d) => d.scope === "INTERNATIONAL");

  return (
    <>
      {domestic.length > 0 ? (
        <DestinationCarousel
          items={domestic}
          title="Domestic Destinations"
          subtitle="Top routes within Pakistan"
        />
      ) : null}
      {international.length > 0 ? (
        <DestinationCarousel
          items={international}
          title="International Destinations"
          subtitle="Popular routes beyond Pakistan"
        />
      ) : null}
    </>
  );
}

type DestinationCarouselProps = {
  items: Destination[];
  title: string;
  subtitle: string;
};

function DestinationCarousel({ items, title, subtitle }: DestinationCarouselProps) {
  return (
    <CardCarousel ariaLabel={title} title={title} subtitle={subtitle} scrollLabel="destinations">
      {items.map((d) => (
        <Link
          key={d.id}
          href={`/destinations/${d.slug?.trim() ? d.slug : d.id}`}
          className="group block w-[78%] shrink-0 snap-start sm:w-64"
          aria-label={`View details for ${d.city}`}
        >
          <article>
            <div
              className="relative aspect-4/3 overflow-hidden rounded-2xl"
              style={{ background: GRADIENTS[d.gradient] ?? GRADIENTS.blue }}
            >
              {d.imageUrl ? (
                <Image
                  src={d.imageUrl}
                  alt={d.city}
                  fill
                  sizes="(min-width: 640px) 256px, 78vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              ) : null}
              {d.iataCode ? (
                <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-0.5 text-[11px] font-bold tracking-wider text-foreground shadow-card">
                  {d.iataCode}
                </span>
              ) : null}
            </div>

            <div className="pt-3">
              <h3 className="text-base font-semibold text-foreground group-hover:text-brand">
                {d.city}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-3.5 shrink-0" />
                {d.country}
              </p>
              {d.notes && (
                <p className="mt-1 line-clamp-1 text-xs text-muted">{d.notes}</p>
              )}
              <p className="mt-1.5 text-sm text-muted">
                Flights from{" "}
                <span className="font-semibold text-foreground">{d.fare}</span>
              </p>
            </div>
          </article>
        </Link>
      ))}
    </CardCarousel>
  );
}
