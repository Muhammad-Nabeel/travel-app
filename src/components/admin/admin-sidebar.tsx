"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Compass,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Package,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/umrah-packages", label: "Umrah Packages", icon: Package },
  { href: "/admin/destinations", label: "Destinations", icon: Compass },
  { href: "/admin/activities", label: "Activities", icon: Sparkles },
  { href: "/admin/blog", label: "Blog", icon: NotebookPen },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [ga4Status, setGa4Status] = useState<"checking" | "ok" | "error">(
    "checking",
  );
  const [ga4Message, setGa4Message] = useState("Checking GA4 connection...");

  const checkGa4Health = useCallback(async (resetState = true) => {
    if (resetState) {
      setGa4Status("checking");
      setGa4Message("Checking GA4 connection...");
    }

    try {
      const res = await fetch("/api/admin/settings/ga4?test=true", {
        cache: "no-store",
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };

      if (res.ok && json.ok) {
        setGa4Status("ok");
        setGa4Message(json.message ?? "GA4 connection is healthy.");
        return;
      }

      setGa4Status("error");
      setGa4Message(json.message ?? "GA4 connection check failed.");
    } catch {
      setGa4Status("error");
      setGa4Message("Unable to reach GA4 test endpoint.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkGa4Health(false);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [checkGa4Health]);

  return (
    <aside className="sticky top-0 h-screen w-full border-r border-blue-200/80 bg-white text-slate-800 lg:w-72">
      <div className="flex h-full flex-col p-5">
        <div className="mb-6 border-b border-blue-100 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-500">
            Admin Panel
          </p>
          <h1 className="mt-2 text-2xl font-bold text-blue-900">Safar Ops</h1>
        </div>

        <nav className="space-y-1.5">
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

        <div className="mt-auto rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <BarChart3 className="h-4 w-4" />
            <p className="text-sm font-semibold">Live Monitoring</p>
          </div>

          <div className="mt-3 rounded-xl border border-blue-100 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                GA4 Health
              </p>
              <button
                type="button"
                onClick={() => void checkGa4Health(true)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Refresh GA4 health"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${ga4Status === "checking" ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <p
              className={`mt-1 text-xs font-semibold ${
                ga4Status === "ok"
                  ? "text-emerald-700"
                  : ga4Status === "checking"
                    ? "text-amber-700"
                    : "text-rose-700"
              }`}
            >
              {ga4Status === "ok"
                ? "Connected"
                : ga4Status === "checking"
                  ? "Checking"
                  : "Disconnected"}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              {ga4Message}
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-blue-600">
            Search trends and visitor traffic blocks are active on dashboard.
          </p>

          <Link
            href="/"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
}
