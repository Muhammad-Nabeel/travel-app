import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
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

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_NAME,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
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
      className={`${plusJakartaSans.variable} ${cormorantGaramond.variable} h-full antialiased`}
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
