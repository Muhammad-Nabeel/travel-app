import type { Metadata } from "next";

export const SITE_NAME = "Safar Umrah";
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
export const SITE_DESCRIPTION =
  "Search flights, compare destinations, book activities, and plan Umrah travel with clearer pricing and practical support.";

const DEFAULT_SITE_URL = "http://localhost:3000";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : DEFAULT_SITE_URL);

type MetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
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
  keywords?: string[];
};

type OrganizationSchemaOptions = {
  telephone?: string;
  email?: string;
  address?: string;
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

  return `${compact.slice(0, maxLength - 1).trimEnd()}...`;
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildMetadata({
  title,
  description,
  path,
  keywords = [],
  image,
  noIndex = false,
  type = "website",
  publishedTime,
  modifiedTime,
}: MetadataOptions): Metadata {
  const canonicalPath = normalizePath(path);
  const finalDescription = toMetaDescription(description);
  const finalImage = resolveImageUrl(image);

  return {
    title,
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
      siteName: SITE_NAME,
      locale: "en_GB",
      images: [
        {
          url: finalImage,
          width: 1200,
          height: 630,
          alt: `${title} | ${SITE_NAME}`,
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
  keywords = [],
}: ArticleSchemaOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: toMetaDescription(description),
    image: [resolveImageUrl(image)],
    datePublished: publishedTime ?? undefined,
    dateModified: modifiedTime ?? publishedTime ?? undefined,
    author: {
      "@type": "Organization",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: resolveImageUrl(),
      },
    },
    mainEntityOfPage: absoluteUrl(path),
    keywords,
  };
}

export function createOrganizationSchema({
  telephone,
  email,
  address,
}: OrganizationSchemaOptions = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    telephone: telephone || undefined,
    email: email || undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address,
        }
      : undefined,
  };
}

export function createWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
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