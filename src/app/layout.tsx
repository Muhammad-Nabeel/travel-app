import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Loading from "./loading";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { Ga4Loader } from "@/components/analytics/ga4-loader";
import { FloatingReviewWidget } from "@/components/shared/floating-review-widget";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import {
  getSiteUrl,
  resolveImageUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
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

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_NAME,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
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
    "Safar Umrah",
    "Umrah packages",
    "flight booking",
    "travel planning",
    "visa services",
    "travel blog",
  ],
  openGraph: {
    type: "website",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "en_GB",
    url: "/",
    images: [
      {
        url: resolveImageUrl(),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="corporate"
      className={`${plusJakartaSans.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <Ga4Loader />
          <ConditionalNavbar />
          <main className="w-full flex-1">
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </main>
          <FloatingReviewWidget />
          <ConditionalFooter />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
