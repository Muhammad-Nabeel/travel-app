import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Admin",
  description: "Administrative controls for Safar Umrah.",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-sky-50 to-white">
      <div className="mx-auto grid min-h-screen grid-cols-1 lg:grid-cols-[18rem_1fr]">
        <AdminSidebar />
        <section className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</section>
      </div>
    </div>
  );
}
