import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Loading from "./loading";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { Ga4Loader } from "@/components/analytics/ga4-loader";
import { FloatingReviewWidget } from "@/components/shared/floating-review-widget";

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
  title: "Safar Umrah",
  description:
    "Travel platform foundation for flights, hotels, and admin-managed Umrah packages.",
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
        <Ga4Loader />
        <ConditionalNavbar />
        <main className="w-full flex-1">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>
        <FloatingReviewWidget />
        <ConditionalFooter />
      </body>
    </html>
  );
}
