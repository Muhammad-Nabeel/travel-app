"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, PlaneTakeoff, Sun } from "lucide-react";

const links = [
  { href: "/flights", label: "Flights" },
  { href: "/hotels", label: "Hotels" },
  { href: "/umrah-packages", label: "Packages" },
];

const NavBar = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "safar-dark" : "safar",
    );
  }, [dark]);

  return (
    <header className="sticky top-0 z-50">
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
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "rounded-full bg-black px-4 py-2 text-sm font-semibold text-white! transition hover:bg-black/90 hover:text-white!"
                    : "rounded-full px-4 py-2 text-sm font-medium text-black/80 transition hover:bg-black/10 hover:text-black"
                }
              >
                {item.label}
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
            href="/admin"
            className="rounded-full border border-black/20 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/5"
          >
            Admin
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white! transition hover:bg-black/85 hover:text-white!"
          >
            Login / Signup
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
