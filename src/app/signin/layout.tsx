import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildMetadata } from "@/lib/seo";

// The page is a client component and cannot export metadata itself.
export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  description: "Sign in to your Safar Umrah account to view bookings, saved trips and payment details.",
  path: "/signin",
  noIndex: true,
});

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
