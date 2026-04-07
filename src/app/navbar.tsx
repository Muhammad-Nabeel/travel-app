"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  FileCheck2,
  LogIn,
  Moon,
  Package,
  Plane,
  PlaneTakeoff,
  Sun,
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
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
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
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
