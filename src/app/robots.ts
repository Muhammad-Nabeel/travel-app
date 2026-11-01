import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

// Private pages (sign-in, dashboard, booking, payment) are excluded with a
// noindex meta tag instead of Disallow: Google must be able to crawl a page
// to see its noindex, otherwise a linked URL can still be indexed.
// /api/ stays crawlable: homepage sections still fetch their data client-side
// and Googlebot needs those responses to render the content.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
