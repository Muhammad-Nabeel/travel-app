"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCurrencySettings } from "@/lib/hooks/use-currency-settings";
import { useBrand } from "@/components/shared/brand-provider";
import type { BrandAssetSlot } from "@/lib/brand-assets";
import { CurrencySelector } from "@/components/shared/currency-selector";
import {
  BedDouble,
  Briefcase,
  ChevronDown,
  FileCheck2,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Plane,
  PlaneTakeoff,
  Ticket,
  User,
  X,
} from "lucide-react";

const links: {
  href: string;
  label: string;
  description: string;
  icon: typeof Plane;
  asset: BrandAssetSlot;
}[] = [
  { href: "/flights", label: "Flights", description: "Search and compare fares", icon: Plane, asset: "flights" },
  { href: "/umrah-packages", label: "Umrah packages", description: "Makkah & Madinah stays", icon: MoonStar, asset: "umrah" },
  { href: "/tour-packages", label: "Tour packages", description: "Curated holidays", icon: Briefcase, asset: "tours" },
  { href: "/hotels", label: "Hotels", description: "Stays near the Haram", icon: BedDouble, asset: "hotels" },
  { href: "/visa", label: "Visa", description: "Applications made simple", icon: FileCheck2, asset: "visa" },
  { href: "/activities", label: "Things to do", description: "Tours and experiences", icon: Ticket, asset: "activities" },
];

const NavBar = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("PKR");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const shopMenuRef = useRef<HTMLDivElement>(null);

  const { settings: currencySettings, loading: currencyLoading } = useCurrencySettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCurrency = window.localStorage
      .getItem("selectedCurrency")
      ?.toUpperCase();

    if (storedCurrency) {
      setSelectedCurrency(storedCurrency);
      return;
    }

    if (!currencyLoading && currencySettings.defaultCurrency) {
      setSelectedCurrency(currencySettings.defaultCurrency);
    }
  }, [currencySettings.defaultCurrency, currencyLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

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

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        shopMenuRef.current &&
        !shopMenuRef.current.contains(event.target as Node)
      ) {
        setShopMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  const brand = useBrand();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref = role === "ADMIN" ? "/admin" : "/dashboard";

  async function handleSignOut() {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header ref={headerRef} className="sticky top-0 z-50">
      <nav
        className={`border-b border-line bg-white transition-shadow duration-200 ${
          scrolled ? "shadow-card" : ""
        }`}
      >
        <div className="section-shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              aria-label={`${brand.name} home`}
              className="flex items-center gap-2 transition hover:opacity-80"
            >
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt={`${brand.name} logo`}
                  width={160}
                  height={36}
                  preload
                  className="h-9 w-auto object-contain"
                />
              ) : (
                <span className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
                    <PlaneTakeoff className="size-4" />
                  </span>
                  <span className="text-xl font-bold tracking-tight text-foreground">
                    {brand.name}
                  </span>
                </span>
              )}
            </Link>

            <div ref={shopMenuRef} className="relative hidden md:block">
              <button
                type="button"
                aria-expanded={shopMenuOpen}
                onClick={() => setShopMenuOpen((v) => !v)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-semibold text-foreground transition hover:bg-subtle"
              >
                Shop travel
                <ChevronDown
                  className={`size-4 transition-transform ${shopMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {shopMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-line bg-white p-2 shadow-raised">
                  {links.map(({ href, label, description, icon: Icon, asset }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setShopMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-subtle ${
                        isActive(href) ? "bg-brand-soft" : ""
                      }`}
                    >
                      {brand.assets[asset] ? (
                        <Image src={brand.assets[asset]} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <Icon className="size-4.5" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {label}
                        </span>
                        <span className="block text-xs text-muted">
                          {description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
            />

            <Link
              href="/contact-us"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-foreground transition hover:bg-subtle lg:flex"
            >
              <Headphones className="size-4" />
              Support
            </Link>

            <div className="hidden md:flex">
              {status === "loading" ? (
                <div className="ml-2 size-9 animate-pulse rounded-full bg-subtle" />
              ) : session?.user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    aria-expanded={userMenuOpen}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-foreground transition hover:bg-subtle"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <User className="size-4" />
                    </span>
                    <span className="max-w-30 truncate">
                      {session.user.name ?? session.user.email}
                    </span>
                    <ChevronDown className="size-4 text-muted" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-line bg-white py-2 shadow-raised">
                      <div className="border-b border-line px-4 pb-3 pt-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {session.user.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {session.user.email}
                        </p>
                      </div>
                      <Link
                        href={dashboardHref}
                        onClick={() => setUserMenuOpen(false)}
                        className="mt-1 flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition hover:bg-subtle"
                      >
                        <LayoutDashboard className="size-4" />
                        {role === "ADMIN" ? "Admin dashboard" : "My trips"}
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-deal transition hover:bg-subtle"
                      >
                        <LogOut className="size-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="ml-1 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white! transition hover:bg-brand-strong"
                >
                  Sign in
                </Link>
              )}
            </div>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-foreground transition hover:bg-subtle md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-60 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-navy/40"
          />
          <div
            className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-raised"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="text-base font-semibold text-foreground">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-foreground transition hover:bg-subtle"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <p className="px-3 pb-2 pt-1 text-xs font-semibold text-muted">
                Shop travel
              </p>
              {links.map(({ href, label, icon: Icon, asset }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive(href)
                      ? "bg-brand-soft text-brand"
                      : "text-foreground hover:bg-subtle"
                  }`}
                >
                  {brand.assets[asset] ? (
                    <Image src={brand.assets[asset]} alt="" width={24} height={24} className="size-6 object-contain" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  {label}
                </Link>
              ))}

              <div className="my-3 border-t border-line" />

              <Link
                href="/contact-us"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-subtle"
              >
                <Headphones className="size-5" />
                Support
              </Link>

              {session?.user && (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-subtle"
                  >
                    <LayoutDashboard className="size-5" />
                    {role === "ADMIN" ? "Admin dashboard" : "My trips"}
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-deal transition hover:bg-subtle"
                  >
                    <LogOut className="size-5" />
                    Sign out
                  </button>
                </>
              )}
            </div>

            <div className="border-t border-line p-4">
              {session?.user ? (
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <User className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {session.user.name}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full bg-brand px-4 py-3 text-center text-sm font-semibold text-white! transition hover:bg-brand-strong"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full border border-line px-4 py-3 text-center text-sm font-semibold text-foreground transition hover:bg-subtle"
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
