"use client";

import type { ReactNode } from "react";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ExternalLink, Menu } from "lucide-react";

import {
  AdminSidebar,
  adminNavGroups,
  isAdminLinkActive,
} from "@/components/admin/admin-sidebar";

const COLLAPSE_KEY = "admin-sidebar-collapsed";
const COLLAPSE_EVENT = "admin-sidebar-collapse";

function subscribeCollapsed(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  const current = adminNavGroups
    .flatMap((group) => group.links.map((link) => ({ ...link, group: group.title })))
    .find((link) => isAdminLinkActive(link.href, pathname));

  return (
    <div className="min-h-screen bg-subtle">
      {/* Desktop sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 lg:block ${collapsed ? "w-18" : "w-64"}`}
      >
        <AdminSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-raised">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? "lg:pl-18" : "lg:pl-64"}`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:bg-subtle lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-sm"
          >
            <span className="hidden text-muted sm:inline">
              {current?.group ?? "Admin"}
            </span>
            <ChevronRight className="hidden h-3.5 w-3.5 text-muted/70 sm:block" />
            <span className="truncate font-semibold text-navy">
              {current?.label ?? "Admin"}
            </span>
          </nav>
          <Link
            href="/"
            target="_blank"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-navy/80 transition hover:border-brand hover:text-brand"
          >
            View site
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </header>

        <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </section>
      </div>
    </div>
  );
}
