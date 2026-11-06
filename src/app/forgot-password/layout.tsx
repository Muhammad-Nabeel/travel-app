import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildMetadata } from "@/lib/seo";

// The page is a client component and cannot export metadata itself.
export const metadata: Metadata = buildMetadata({
  title: "Forgot Password",
  description: "Request a link to reset the password for your account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
