import type { Metadata } from "next";

/** Fallback brand name; the live name is set in Admin → Settings → Brand. */
export const SITE_NAME = "EasyTrip";
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
export const SITE_DESCRIPTION =
  "Search flights, compare destinations, book activities, and plan Umrah travel with clearer pricing and practical support.";

const DEFAULT_SITE_URL = "http://localhost:3004";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : DEFAULT_SITE_URL);

type MetadataOptions = {
  title: string;
  /** Skip the root " | <brand>" template (homepage, titles that already carry the brand). */
  absoluteTitle?: boolean;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Brand shown as the Open Graph site name. */
  siteName?: string;
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

type WebPageSchemaOptions = {
  title: string;
  description: string;
  path: string;
  type?: string;
};

type ArticleSchemaOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authorName?: string;
  /** Profile URL of a named author; when present the author is a Person. */
  authorUrl?: string;
  keywords?: string[];
  section?: string;
  /** Live brand name and logo (Admin → Settings → Brand). */
  publisherName: string;
  publisherLogoUrl: string | null;
};

type OrganizationBranch = {
  name: string;
  city: string;
  address: string;
  phone?: string | null;
};

type OrganizationAddress = {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
};

type OrganizationSchemaOptions = {
  name?: string;
  legalName?: string;
  logoUrl?: string;
  telephone?: string;
  email?: string;
  address?: OrganizationAddress;
  latitude?: string;
  longitude?: string;
  /** schema.org shorthand rules, e.g. "Mo-Sa 10:00-19:00". */
  openingHours?: string[];
  priceRange?: string;
  mapUrl?: string;
  sameAs?: string[];
  branches?: OrganizationBranch[];
};

/** Stable node ids so every page's JSON-LD links to the same business and site. */
export const ORGANIZATION_ID_PATH = "/#organization";
export const WEBSITE_ID_PATH = "/#website";

const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const DAY_NAMES: Record<(typeof DAY_ORDER)[number], string> = {
  Mo: "Monday",
  Tu: "Tuesday",
  We: "Wednesday",
  Th: "Thursday",
  Fr: "Friday",
  Sa: "Saturday",
  Su: "Sunday",
};

/** "Mo-Sa 10:00-19:00" -> OpeningHoursSpecification. Rules are validated on save. */
function toOpeningHoursSpecification(rule: string) {
  const [days, hours] = rule.split(" ");
  const [from, to = from] = days.split("-") as Array<(typeof DAY_ORDER)[number]>;
  const [opens, closes] = hours.split("-");
  const start = DAY_ORDER.indexOf(from);
  const end = DAY_ORDER.indexOf(to);
  const dayList =
    start <= end
      ? DAY_ORDER.slice(start, end + 1)
      : [...DAY_ORDER.slice(start), ...DAY_ORDER.slice(0, end + 1)];

  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: dayList.map((day) => `https://schema.org/${DAY_NAMES[day]}`),
    opens,
    closes,
  };
}

function compactAddress(address: OrganizationAddress = {}) {
  const entries = Object.entries(address).filter(([, value]) => Boolean(value));
  return entries.length > 0
    ? { "@type": "PostalAddress", ...Object.fromEntries(entries) }
    : undefined;
}

type TouristTripSchemaOptions = {
  name: string;
  description: string;
  path: string;
  image?: string | null;
  price: number;
  currency: string;
  seatsAvailable?: number;
  validFrom?: string;
  validThrough?: string;
  itinerary?: string[];
  touristType?: string;
};

export function getSiteUrl() {
  return new URL(SITE_URL);
}

export function absoluteUrl(path: string) {
  return new URL(normalizePath(path), getSiteUrl()).toString();
}

export function normalizePath(path: string) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function resolveImageUrl(image?: string) {
  if (!image) {
    return absoluteUrl("/opengraph-image");
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return absoluteUrl(image);
}

export function toMetaDescription(value: string, maxLength = 160) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildMetadata({
  title,
  absoluteTitle = false,
  description,
  path,
  keywords = [],
  image,
  noIndex = false,
  type = "website",
  publishedTime,
  modifiedTime,
  siteName = SITE_NAME,
}: MetadataOptions): Metadata {
  const canonicalPath = normalizePath(path);
  const finalDescription = toMetaDescription(description);
  const finalImage = resolveImageUrl(image);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: finalDescription,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type,
      title,
      description: finalDescription,
      url: absoluteUrl(canonicalPath),
      siteName,
      locale: "en_PK",
      images: [
        {
          url: finalImage,
          width: 1200,
          height: 630,
          alt: absoluteTitle ? title : `${title} | ${siteName}`,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: finalDescription,
      images: [finalImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        },
  };
}

export function createWebPageSchema({
  title,
  description,
  path,
  type = "WebPage",
}: WebPageSchemaOptions) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": absoluteUrl(path),
    name: title,
    description: toMetaDescription(description),
    url: absoluteUrl(path),
    isPartOf: { "@id": absoluteUrl(WEBSITE_ID_PATH) },
    inLanguage: "en-PK",
  };
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createArticleSchema({
  title,
  description,
  path,
  image,
  publishedTime,
  modifiedTime,
  authorName = SITE_NAME,
  authorUrl,
  keywords = [],
  section,
  publisherName,
  publisherLogoUrl,
}: ArticleSchemaOptions) {
  // Only claim a Person author when there is a profile page to back it up.
  const isPerson = Boolean(authorUrl);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title.slice(0, 110),
    description: toMetaDescription(description),
    image: [resolveImageUrl(image)],
    datePublished: publishedTime ?? undefined,
    dateModified: modifiedTime ?? publishedTime ?? undefined,
    author: {
      "@type": isPerson ? "Person" : "Organization",
      name: authorName,
      ...(authorUrl ? { url: absoluteUrl(authorUrl) } : {}),
    },
    publisher: {
      "@type": "Organization",
      "@id": absoluteUrl(ORGANIZATION_ID_PATH),
      name: publisherName,
      url: absoluteUrl("/"),
      logo: publisherLogoUrl
        ? { "@type": "ImageObject", url: publisherLogoUrl }
        : undefined,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(path),
    },
    articleSection: section,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    inLanguage: "en-PK",
  };
}

export function createOrganizationSchema({
  name = SITE_NAME,
  legalName,
  logoUrl,
  telephone,
  email,
  address,
  latitude,
  longitude,
  openingHours = [],
  priceRange,
  mapUrl,
  sameAs = [],
  branches = [],
}: OrganizationSchemaOptions = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": absoluteUrl(ORGANIZATION_ID_PATH),
    name,
    legalName: legalName || undefined,
    url: absoluteUrl("/"),
    logo: logoUrl || undefined,
    image: resolveImageUrl(),
    description: SITE_DESCRIPTION,
    telephone: telephone || undefined,
    email: email || undefined,
    address: compactAddress(address),
    geo:
      latitude && longitude
        ? { "@type": "GeoCoordinates", latitude, longitude }
        : undefined,
    hasMap: mapUrl || undefined,
    openingHoursSpecification:
      openingHours.length > 0
        ? openingHours.map(toOpeningHoursSpecification)
        : undefined,
    priceRange: priceRange || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    contactPoint: telephone
      ? {
          "@type": "ContactPoint",
          telephone,
          contactType: "customer service",
          availableLanguage: ["English", "Urdu"],
        }
      : undefined,
    department:
      branches.length > 0
        ? branches.map((branch) => ({
            "@type": "TravelAgency",
            name: `${SITE_NAME} – ${branch.name}`,
            telephone: branch.phone || undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: branch.address,
              addressLocality: branch.city,
            },
          }))
        : undefined,
  };
}

export function createTouristTripSchema({
  name,
  description,
  path,
  image,
  price,
  currency,
  seatsAvailable,
  validFrom,
  validThrough,
  itinerary = [],
  touristType,
}: TouristTripSchemaOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name,
    description: toMetaDescription(description),
    url: absoluteUrl(path),
    image: image ? resolveImageUrl(image) : undefined,
    touristType: touristType || undefined,
    provider: { "@id": absoluteUrl(ORGANIZATION_ID_PATH) },
    itinerary:
      itinerary.length > 0
        ? {
            "@type": "ItemList",
            itemListElement: itinerary.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item,
            })),
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      url: absoluteUrl(path),
      availability:
        seatsAvailable === undefined || seatsAvailable > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      validFrom: validFrom || undefined,
      priceValidUntil: validThrough ? validThrough.slice(0, 10) : undefined,
    },
  };
}

export function createWebsiteSchema(name = SITE_NAME) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl(WEBSITE_ID_PATH),
    name,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    publisher: { "@id": absoluteUrl(ORGANIZATION_ID_PATH) },
    inLanguage: "en-PK",
  };
}

export function createFAQSchema(
  questions: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function createItemListSchema(
  items: Array<{ name: string; path: string }>,
  title: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}