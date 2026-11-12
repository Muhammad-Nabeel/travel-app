import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { SiteFooter } from "@/components/shared/site-footer";
import {
  getStoredSupportContactSettings,
  getWhatsappLink,
} from "@/lib/admin-settings/support-contact-settings";
import { getPublicBrand } from "@/lib/admin-settings/brand-settings";
import { BrandProvider } from "@/components/shared/brand-provider";
import { LiveFaresProvider } from "@/components/shared/live-fares-provider";
import { getActiveSabreSettings } from "@/lib/admin-settings/sabre-settings";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { AnalyticsGate } from "@/components/analytics/analytics-gate";
import { CaptchaProvider } from "@/components/shared/captcha";
import { ErrorTrackingClient } from "@/components/analytics/error-tracking-client";
import { getPublicErrorTrackingConfig } from "@/lib/admin-settings/error-tracking-settings";
import { getPublicCaptchaSiteKey } from "@/lib/admin-settings/captcha-settings";
import { Ga4Loader } from "@/components/analytics/ga4-loader";
import { getPublicAnalyticsConfig } from "@/lib/admin-settings/ga4-settings";
import { FloatingReviewWidgetLazy } from "@/components/shared/floating-review-widget-lazy";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import {
  getSiteUrl,
  resolveImageUrl,
  SITE_DESCRIPTION,
} from "@/lib/seo";

// Brand typeface: the geometric sans used in the logo, for text and headings.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

// Public pages read packages, posts and SEO settings from the database. Without
// this they would be prerendered once at build time and admin edits would not
// appear until the next deploy. Re-render at most every 5 minutes (ISR);
// the SEO settings route also revalidates on save.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { name, assets } = await getPublicBrand();
  // Favicon uploaded in Admin → Media → Brand & Icons, else public/favicon.ico.
  const icon = assets.icon ?? "/favicon.ico";

  return {
  metadataBase: getSiteUrl(),
  icons: { icon, apple: assets.icon },
  title: {
    default: name,
    template: `%s | ${name}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: name,
  // No root canonical: every indexable page sets its own via buildMetadata().
  // A canonical here would be inherited by pages that forget to set one and
  // tell Google they are duplicates of the homepage.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  keywords: [
    name,
    "Umrah packages",
    "flight booking",
    "travel planning",
    "visa services",
    "travel blog",
  ],
  openGraph: {
    type: "website",
    title: name,
    description: SITE_DESCRIPTION,
    siteName: name,
    locale: "en_PK",
    url: "/",
    images: [
      {
        url: resolveImageUrl(),
        width: 1200,
        height: 630,
        alt: name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: name,
    description: SITE_DESCRIPTION,
    images: [resolveImageUrl()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [brand, contact, sabreSettings, analytics, captchaSiteKey, errorTracking] = await Promise.all([
    getPublicBrand(),
    getStoredSupportContactSettings(),
    getActiveSabreSettings(),
    getPublicAnalyticsConfig(),
    getPublicCaptchaSiteKey(),
    getPublicErrorTrackingConfig(),
  ]);

  return (
    <html
      lang="en-PK"
      data-theme="corporate"
      // Read by trackEvent() to route events to GTM or gtag.js.
      data-analytics={analytics?.provider}
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <BrandProvider brand={brand}>
          <LiveFaresProvider enabled={sabreSettings !== null}>
          <CaptchaProvider siteKey={captchaSiteKey}>
          <ErrorTrackingClient config={errorTracking} />
          <AnalyticsGate>
            <Ga4Loader config={analytics} />
          </AnalyticsGate>
          <ConditionalNavbar />
          {/* No root Suspense/loading.tsx: a spinner fallback let the footer paint
              first and then jump down when the page streamed in (CLS ~0.8).
              Slow routes add their own page-shaped loading.tsx instead. */}
          <main className="w-full flex-1">{children}</main>
          <FloatingReviewWidgetLazy whatsappLink={getWhatsappLink(contact)} />
          <ConditionalFooter>
            <SiteFooter brand={brand} contact={contact} />
          </ConditionalFooter>
          </CaptchaProvider>
          </LiveFaresProvider>
          </BrandProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
