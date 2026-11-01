"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { useBrand } from "@/components/shared/brand-provider";
import {
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  Compass,
  FileCheck2,
  Image,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  NotebookPen,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Star,
  X,
} from "lucide-react";

type AdminLink = { href: string; label: string; icon: LucideIcon };

export const adminNavGroups: { title: string; links: AdminLink[] }[] = [
  {
    title: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
    ],
  },
  {
    title: "Catalogue",
    links: [
      { href: "/admin/umrah-packages", label: "Umrah Packages", icon: Package },
      { href: "/admin/tour-packages", label: "Tour Packages", icon: Briefcase },
      { href: "/admin/destinations", label: "Destinations", icon: Compass },
      { href: "/admin/activities", label: "Activities", icon: Sparkles },
      { href: "/admin/visa", label: "Visa Settings", icon: FileCheck2 },
    ],
  },
  {
    title: "Content",
    links: [
      { href: "/admin/blog", label: "Blog", icon: NotebookPen },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/site-pages", label: "Site Pages", icon: MessagesSquare },
      { href: "/admin/careers", label: "Careers", icon: BriefcaseBusiness },
      { href: "/admin/media", label: "Media", icon: Image },
    ],
  },
  {
    title: "Configuration",
    links: [
      { href: "/admin/seo", label: "SEO", icon: Search },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function isAdminLinkActive(href: string, pathname: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const brand = useBrand();

  return (
    <aside className="flex h-full min-h-0 flex-col bg-navy text-white">
      <div
        className={`flex h-16 shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}
      >
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold">
            {brand.name.charAt(0)}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {brand.name}
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">
                Admin
              </span>
            </span>
          )}
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {adminNavGroups.map((group) => (
          <div key={group.title}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
            ) : (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon }) => {
                const active = isAdminLinkActive(href, pathname);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      title={collapsed ? label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition ${
                        collapsed ? "justify-center px-2" : "px-3"
                      } ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/65 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand" />
                      )}
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 ${active ? "text-[#7fb0ff]" : ""}`}
                      />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand menu" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white ${collapsed ? "justify-center px-2" : "px-3"}`}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" />
            ) : (
              <>
                <PanelLeftClose className="h-4.5 w-4.5" />
                Collapse
              </>
            )}
          </button>
        )}
        <Link
          href="/"
          title={collapsed ? "Logout" : undefined}
          className={`flex items-center gap-3 rounded-lg py-2 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white ${collapsed ? "justify-center px-2" : "px-3"}`}
        >
          <LogOut className="h-4.5 w-4.5" />
          {!collapsed && "Logout"}
        </Link>
      </div>
    </aside>
  );
}
