"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Menu } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className={`mx-auto grid min-h-screen grid-cols-1 ${sidebarOpen ? "lg:grid-cols-[18rem_1fr]" : "lg:grid-cols-1"}`}
    >
      {sidebarOpen && <AdminSidebar onToggle={() => setSidebarOpen(false)} />}
      <section className="min-h-screen p-4 sm:p-6 lg:p-8">
        {!sidebarOpen && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Menu className="h-4 w-4" />
              Show menu
            </button>
          </div>
        )}
        {children}
      </section>
    </div>
  );
}
