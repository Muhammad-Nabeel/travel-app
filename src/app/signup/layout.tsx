import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildMetadata } from "@/lib/seo";

// The page is a client component and cannot export metadata itself.
export const metadata: Metadata = buildMetadata({
  title: "Create an Account",
  description: "Create an account to manage your Umrah, flight and holiday bookings in one place.",
  path: "/signup",
  noIndex: true,
});

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children;
}
