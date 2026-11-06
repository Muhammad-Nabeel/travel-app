import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildMetadata } from "@/lib/seo";

// The page is a client component and cannot export metadata itself.
export const metadata: Metadata = buildMetadata({
  title: "Reset Password",
  description: "Choose a new password for your account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
