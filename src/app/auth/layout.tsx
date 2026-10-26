import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildMetadata } from "@/lib/seo";

// The page is a client component and cannot export metadata itself.
export const metadata: Metadata = buildMetadata({
  title: "Signing In",
  description: "Completing sign-in to your Safar Umrah account.",
  path: "/auth/redirect",
  noIndex: true,
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
