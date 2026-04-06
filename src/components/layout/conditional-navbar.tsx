"use client";

import { usePathname } from "next/navigation";

import NavBar from "@/app/navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return null;
  }

  return <NavBar />;
}
