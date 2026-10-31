import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { SiteFooter } from "@/components/shared/site-footer";
import { getStoredSupportContactSettings } from "@/lib/admin-settings/support-contact-settings";
import { getPublicBrand } from "@/lib/admin-settings/brand-settings";
import { BrandProvider } from "@/components/shared/brand-provider";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { Ga4Loader } from "@/components/analytics/ga4-loader";
import { FloatingReviewWidget } from "@/components/shared/floating-review-widget";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import {
  getSiteUrl,
  resolveImageUrl,
  SITE_DESCRIPTION,
} from "@/lib/seo";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: "400",
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
    locale: "en_GB",
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
  const [brand, contact] = await Promise.all([
    getPublicBrand(),
    getStoredSupportContactSettings(),
  ]);

  return (
    <html
      lang="en"
      data-theme="corporate"
      className={`${plusJakartaSans.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <BrandProvider brand={brand}>
          <Ga4Loader />
          <ConditionalNavbar />
          {/* No root Suspense/loading.tsx: a spinner fallback let the footer paint
              first and then jump down when the page streamed in (CLS ~0.8).
              Slow routes add their own page-shaped loading.tsx instead. */}
          <main className="w-full flex-1">{children}</main>
          <FloatingReviewWidget />
          <ConditionalFooter>
            <SiteFooter brand={brand} contact={contact} />
          </ConditionalFooter>
          </BrandProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
