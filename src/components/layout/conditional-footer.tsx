"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/shared/site-footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return null;
  }

  return <SiteFooter />;
}
