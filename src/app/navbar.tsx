"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  BedDouble,
  FileCheck2,
  LogIn,
  LogOut,
  Moon,
  Package,
  Plane,
  PlaneTakeoff,
  Sun,
  User,
  UserPlus,
} from "lucide-react";

const links = [
  { href: "/flights", label: "Flights", icon: Plane },
  { href: "/hotels", label: "Hotels", icon: BedDouble },
  { href: "/umrah-packages", label: "Umrah Packages", icon: Package },
  { href: "/tour-packages", label: "Tour Packages", icon: Package },
  { href: "/visa", label: "Visa", icon: FileCheck2 },
];

const NavBar = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "business" : "corporate",
    );
  }, [dark]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const height = headerRef.current?.offsetHeight;
      if (!height) {
        return;
      }
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${height}px`,
      );
    };

    updateHeaderHeight();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateHeaderHeight)
        : null;

    if (observer && headerRef.current) {
      observer.observe(headerRef.current);
    }

    window.addEventListener("resize", updateHeaderHeight, { passive: true });
    window.addEventListener("orientationchange", updateHeaderHeight, {
      passive: true,
    });

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
      window.removeEventListener("orientationchange", updateHeaderHeight);
    };
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50">
      <nav
        className={`flex w-full items-center justify-between px-4 py-3 sm:px-8
        backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300
        ${
          scrolled
            ? "border-b border-black/10 bg-white/70 shadow-[0_12px_30px_rgba(15,23,42,0.14)]"
            : "border-b border-white/45 bg-white/40 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-black transition hover:opacity-80"
        >
          <span className="rounded-full bg-sky-400 p-2 text-white shadow-sm">
            <PlaneTakeoff className="size-4" />
          </span>
          <span className="display-font text-2xl leading-none">Safar</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href === "/flights" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "flex items-center gap-1.5 rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    : "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-black/10 hover:text-black"
                }
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Dark / light toggle */}
          <button
            type="button"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDark((d) => !d)}
            className="rounded-full border border-black/20 p-2 text-black transition hover:bg-black/5"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {status === "loading" ? (
            <div className="size-8 rounded-full bg-black/10 animate-pulse" />
          ) : session?.user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                className="flex items-center gap-2 rounded-full border border-black/20 px-3 py-1.5 text-sm font-medium text-black transition hover:bg-black/5"
              >
                <User className="size-4" />
                <span className="max-w-30 truncate">
                  {session.user.name ?? session.user.email}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-black/10 bg-white shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-black/8">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="size-3.5" />
                    My dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="size-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="flex items-center gap-1.5 rounded-full border border-black/20 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/5"
              >
                <LogIn className="size-4" />
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 rounded-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white! transition hover:bg-black/85 hover:text-white!"
              >
                <UserPlus className="size-4" />
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
