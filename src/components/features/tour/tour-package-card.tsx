import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, MapPin, Star } from "lucide-react";

import { getTourPackagePath, type TourPackage } from "@/lib/tour-packages";

type TourPackageCardProps = {
  pkg: TourPackage;
  /** Total for the searched party; defaults to the per-adult price. */
  totalPrice?: number;
  travellers?: number;
  /** Fewer details for compact rows such as "You may also like". */
  compact?: boolean;
};

export function TourPackageCard({
  pkg,
  totalPrice = pkg.pricePerAdult,
  travellers = 1,
  compact = false,
}: TourPackageCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-raised">
      <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-brand to-navy">
        <Image
          src={pkg.imageUrl}
          alt={pkg.destination}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-foreground shadow-card">
          {pkg.tourType}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug text-foreground">
          <Link
            href={getTourPackagePath(pkg.slug)}
            className="after:absolute after:inset-0 group-hover:text-brand"
          >
            {pkg.title}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-3.5 shrink-0" />
          {pkg.destination}
          <span aria-hidden>·</span>
          <CalendarDays className="size-3.5 shrink-0" />
          {pkg.duration} {pkg.duration === 1 ? "day" : "days"}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-xs font-bold text-white">
            {pkg.rating.toFixed(1)}
            <Star className="size-3 fill-white" />
          </span>
          <span className="text-xs text-muted">{pkg.reviewCount} reviews</span>
        </div>

        {!compact ? (
          <ul className="mt-4 space-y-1.5">
            {pkg.highlights.slice(0, 3).map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="size-4 shrink-0 text-success" />
                {h}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          {!compact && pkg.highlights.length > 3 ? (
            <span className="text-xs text-muted">
              +{pkg.highlights.length - 3} more included
            </span>
          ) : (
            <span />
          )}
          <div className="text-right">
            <p className="text-xs text-muted">
              {travellers > 1 ? `Total for ${travellers} travellers` : "from"}
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {pkg.currency} {totalPrice.toLocaleString()}
            </p>
            <p className="text-xs text-muted">
              {travellers > 1 ? "includes taxes" : "per adult"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
