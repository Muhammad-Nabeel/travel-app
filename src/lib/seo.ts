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
};

type OrganizationBranch = {
  name: string;
  city: string;
  address: string;
  phone?: string | null;
};

type OrganizationSchemaOptions = {
  name?: string;
  legalName?: string;
  logoUrl?: string;
  telephone?: string;
  email?: string;
  address?: string;
  sameAs?: string[];
  branches?: OrganizationBranch[];
};

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
      locale: "en_GB",
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
    name: title,
    description: toMetaDescription(description),
    url: absoluteUrl(path),
    isPartOf: absoluteUrl("/"),
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
      name: SITE_NAME,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: resolveImageUrl(),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(path),
    },
    articleSection: section,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    inLanguage: "en",
  };
}

export function createOrganizationSchema({
  name = SITE_NAME,
  legalName,
  logoUrl,
  telephone,
  email,
  address,
  sameAs = [],
  branches = [],
}: OrganizationSchemaOptions = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": absoluteUrl("/#organization"),
    name,
    legalName: legalName || undefined,
    url: absoluteUrl("/"),
    logo: logoUrl || undefined,
    image: resolveImageUrl(),
    description: SITE_DESCRIPTION,
    telephone: telephone || undefined,
    email: email || undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address,
        }
      : undefined,
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
    provider: { "@id": absoluteUrl("/#organization") },
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
    name,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
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