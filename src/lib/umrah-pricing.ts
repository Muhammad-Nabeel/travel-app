import type { PackageRow } from "@/app/api/packages/route";

// Umrah price estimates shared by the configurator and the package page.

export const DURATIONS = [7, 14, 21, 28] as const;
export type Duration = (typeof DURATIONS)[number];

// 0 = Any (no preference). Multipliers are relative to a 4★ base.
export const STAR_OPTIONS = [3, 4, 5] as const;
export type StarRating = 0 | 3 | 4 | 5;

export const STAR_MULTIPLIER: Record<StarRating, number> = {
  0: 1.0,
  3: 0.78,
  4: 1.0,
  5: 1.52,
};

export const STAR_LABEL: Record<StarRating, string> = {
  0: "Any",
  3: "Economy",
  4: "Standard",
  5: "Luxury",
};

export function toDuration(value: unknown, fallback: Duration = 14): Duration {
  const n = Number(value);
  return (DURATIONS as readonly number[]).includes(n) ? (n as Duration) : fallback;
}

export function toStarRating(value: unknown): StarRating {
  const n = Number(value);
  return n === 3 || n === 4 || n === 5 ? n : 0;
}

export function nightSplit(pkg: PackageRow, nights: number) {
  const total = pkg.makkahNights + pkg.madinahNights;
  if (total === 0) return { makkah: nights, madinah: 0 };
  const makkah = Math.round((pkg.makkahNights / total) * nights);
  return { makkah, madinah: nights - makkah };
}

export function priceForConfig(
  pkg: PackageRow,
  nights: number,
  adults: number,
  childCount: number,
  makkahStars: StarRating = 0,
  madinahStars: StarRating = 0,
) {
  const baseNights = pkg.makkahNights + pkg.madinahNights;
  if (baseNights === 0 || nights <= 0) return null;

  const split = nightSplit(pkg, nights);
  const baseRatePerNight = pkg.basePrice / baseNights;
  const perPersonExact =
    baseRatePerNight * STAR_MULTIPLIER[makkahStars] * split.makkah +
    baseRatePerNight * STAR_MULTIPLIER[madinahStars] * split.madinah;

  const perPersonTotal = Math.round(perPersonExact);
  const totalPax = adults + childCount;
  return {
    perPersonTotal,
    allPaxTotal: perPersonTotal * totalPax,
    perNightPerPerson: Math.round(perPersonExact / nights),
    totalPax,
    split,
  };
}

export function formatPax(adults: number, childCount: number) {
  return (
    `${adults} adult${adults !== 1 ? "s" : ""}` +
    (childCount > 0 ? `, ${childCount} child${childCount !== 1 ? "ren" : ""}` : "")
  );
}

/** Query string that carries a configuration between list and detail pages. */
export function configQuery(config: {
  nights: number;
  adults: number;
  childCount: number;
  makkahStars: StarRating;
  madinahStars: StarRating;
}) {
  return (
    `nights=${config.nights}&adults=${config.adults}&children=${config.childCount}` +
    `&makkahStars=${config.makkahStars}&madinahStars=${config.madinahStars}`
  );
}
