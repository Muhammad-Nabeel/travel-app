"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  Image,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  NotebookPen,
  Package,
  Search,
  Settings,
  Sparkles,
  Star,
  X,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
  { href: "/admin/umrah-packages", label: "Umrah Packages", icon: Package },
  { href: "/admin/destinations", label: "Destinations", icon: Compass },
  { href: "/admin/activities", label: "Activities", icon: Sparkles },
  { href: "/admin/blog", label: "Blog", icon: NotebookPen },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/site-pages", label: "Site Pages", icon: MessagesSquare },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/visa", label: "Visa Settings", icon: Compass },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  onToggle?: () => void;
}

export function AdminSidebar({ onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-full border-r border-blue-200/80 bg-white text-slate-800 lg:w-72">
      <div className="flex h-full min-h-0 flex-col p-5">
        <div className="mb-6 flex items-center justify-between border-b border-blue-100 pb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-500">
              Admin Panel
            </p>
            <h1 className="mt-2 text-2xl font-bold text-blue-900">Safar Ops</h1>
          </div>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Hide menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {adminLinks.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-blue-300 text-white shadow-sm"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 shrink-0 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
}
