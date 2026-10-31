import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/seo-copy";
import { SITE_NAME, toMetaDescription } from "@/lib/seo";

// Starting points for the SEO title/description fields in the admin forms.
// They prefill the form so admins never retype content they already entered;
// what gets saved (and rendered) is always the stored seoTitle/seoDescription.
// prisma/migrations/20261101000000_add_seo_fields/migration.sql backfilled
// existing rows with the same wording, and prisma/seed.js mirrors it.

export type SeoCopy = { title: string; description: string };

/** Characters left for the page part of a title once " | <brand>" is appended. */
export function seoTitleBudget(brand = SITE_NAME) {
    return MAX_TITLE_LENGTH - ` | ${brand}`.length;
}

/** First candidate that fits the title budget, else the last one. */
function fitTitleFor(brand: string, ...candidates: string[]) {
    const budget = seoTitleBudget(brand);
    return candidates.find((title) => title.length <= budget) ?? candidates[candidates.length - 1];
}

function stripTrailingStop(value: string) {
    return value.trim().replace(/[.!?]$/, "");
}

export function suggestDestinationSeo(
    input: { city: string; country: string; tagline?: string | null; fare?: string | null },
    brand = SITE_NAME,
): SeoCopy {
    const city = input.city.trim();
    const lead = input.tagline?.trim()
        ? stripTrailingStop(input.tagline)
        : `Plan your trip to ${city}, ${input.country.trim()}`;
    const fare = input.fare?.trim() ? ` Flights from Pakistan from ${input.fare.trim()}.` : "";

    return {
        title: fitTitleFor(
            brand,
            `${city} Travel Guide – Best Time, Tips & Flights`,
            `${city} Travel Guide – Best Time & Tips`,
            `${city} Travel Guide`,
        ),
        description: toMetaDescription(
            `${lead}. Best time to visit ${city}, how long to stay, local tips and things to do.${fare}`,
            MAX_DESCRIPTION_LENGTH,
        ),
    };
}

export function suggestActivitySeo(
    input: { title: string; description?: string | null; cost: string; city?: string | null },
    brand = SITE_NAME,
): SeoCopy {
    const title = input.title.trim();
    const city = input.city?.trim();
    const plain = input.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const firstSentence = plain
        ? stripTrailingStop(plain.split(/(?<=[.!?])\s/)[0])
        : `Discover ${title}${city ? ` in ${city}` : ""}`;
    const cost = input.cost.trim() ? ` From ${input.cost.trim()}.` : "";

    return {
        title: fitTitleFor(
            brand,
            ...(city ? [`${title} in ${city} – Tickets & Prices`] : []),
            `${title} – Tickets & Prices`,
            title,
        ),
        description: toMetaDescription(
            `${firstSentence}.${cost} Check what's included and book with a ${brand} travel adviser.`,
            MAX_DESCRIPTION_LENGTH,
        ),
    };
}

export function suggestUmrahPackageSeo(
    input: {
        title: string;
        departureCity: string;
        makkahNights: number;
        madinahNights: number;
        hotelSummary?: string | null;
        basePrice: number;
        currency: string;
        startDate: string;
    },
    brand = SITE_NAME,
): SeoCopy {
    const title = input.title.trim();
    const totalNights = input.makkahNights + input.madinahNights;
    const start = new Date(input.startDate);
    const departs = Number.isNaN(start.getTime())
        ? ""
        : ` Departs ${start.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
          })}.`;
    const price =
        input.basePrice > 0
            ? ` From ${input.currency} ${Math.round(input.basePrice).toLocaleString("en-GB")} per person.`
            : "";
    const hotel = input.hotelSummary?.trim() ? ` ${stripTrailingStop(input.hotelSummary)}.` : "";

    return {
        title: fitTitleFor(
            brand,
            `${title} – ${totalNights} Nights from ${input.departureCity.trim()}`,
            /umrah/i.test(title) ? `${title} – ${totalNights} Nights` : `${title} – ${totalNights}-Night Umrah`,
            title,
        ),
        description: toMetaDescription(
            `${totalNights}-night Umrah from ${input.departureCity.trim()}: ${input.makkahNights} nights Makkah, ` +
                `${input.madinahNights} nights Madinah.${hotel}${price}${departs}`,
            MAX_DESCRIPTION_LENGTH,
        ),
    };
}

export function visaTypeLabel(type: string) {
    return type === "sticker-visa" ? "Sticker Visa" : "e-Visa";
}

export function suggestVisaSeo(
    input: { country: string; visaType: string; duration: string; entry: string; netCost: string },
    brand = SITE_NAME,
): SeoCopy {
    const country = input.country.trim();
    const label = visaTypeLabel(input.visaType);
    const cost = input.netCost.trim() ? ` Fees from ${input.netCost.trim()}.` : "";
    const entry = /entry$/i.test(input.entry.trim())
        ? input.entry.trim().toLowerCase()
        : `${input.entry.trim()} entry`;

    return {
        title: fitTitleFor(
            brand,
            `${country} ${label} from Pakistan – Requirements & Fees`,
            `${country} Visa from Pakistan – Requirements & Fees`,
            `${country} ${label} – Requirements & Fees`,
            `${country} ${label}`,
        ),
        description: toMetaDescription(
            `Apply for a ${country} ${label} from Pakistan: ${input.duration.trim()} stay, ${entry}.${cost} ` +
                "Document checklist and expert help with your application.",
            MAX_DESCRIPTION_LENGTH,
        ),
    };
}
