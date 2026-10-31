import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Admin",
  description: "Administrative controls for the website.",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-sky-50 to-white">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
