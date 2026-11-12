"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Keeps analytics off the admin panel so staff activity is not counted as
 * site traffic. Customer pages, including /dashboard, are still tracked.
 */
export function AnalyticsGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) {
    return null;
  }
  return children;
}
