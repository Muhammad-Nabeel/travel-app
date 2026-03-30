import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "./navbar";
import { Suspense } from "react";
import Loading from "./loading";
import { SiteFooter } from "@/components/shared/site-footer";

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
      className={`${plusJakartaSans.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="w-full flex-1">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
