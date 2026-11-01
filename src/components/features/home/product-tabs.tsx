"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  Briefcase,
  FileCheck2,
  MoonStar,
  Plane,
  Ticket,
  type LucideIcon,
} from "lucide-react";

import { useBrand } from "@/components/shared/brand-provider";
import type { BrandAssetSlot } from "@/lib/brand-assets";

type Product = {
  key: BrandAssetSlot;
  href: string;
  label: string;
  icon: LucideIcon;
  tint: string;
};

const products: Product[] = [
  { key: "flights", href: "/flights", label: "Flights", icon: Plane, tint: "bg-sky-50 text-sky-600" },
  { key: "umrah", href: "/umrah-packages", label: "Umrah", icon: MoonStar, tint: "bg-amber-50 text-amber-600" },
  { key: "tours", href: "/tour-packages", label: "Tours", icon: Briefcase, tint: "bg-rose-50 text-rose-500" },
  { key: "hotels", href: "/hotels", label: "Hotels", icon: BedDouble, tint: "bg-indigo-50 text-indigo-500" },
  { key: "visa", href: "/visa", label: "Visa", icon: FileCheck2, tint: "bg-emerald-50 text-emerald-600" },
  { key: "activities", href: "/activities", label: "Things to do", icon: Ticket, tint: "bg-orange-50 text-orange-500" },
];

type ProductTabsProps = {
  active: Product["key"];
  /** Spacing that bleeds the bar to the card edges; override for cards without inner padding. */
  className?: string;
};

/**
 * Expedia-style product switcher shown at the top of every service's search card.
 * The active product is rendered in place; the others link to their pages.
 */
export function ProductTabs({ active, className = "-mx-[18px] -mt-4 mb-4" }: ProductTabsProps) {
  const { assets } = useBrand();

  return (
    <nav
      aria-label="Choose what to book"
      className={`${className} flex justify-start gap-1 overflow-x-auto border-b border-line px-3 [scrollbar-width:none] sm:justify-center sm:gap-4`}
    >
      {products.map(({ key, href, label, icon: Icon, tint }) => {
        const isActive = key === active;
        const iconUrl = assets[key];
        const content = (
          <>
            {iconUrl ? (
              <Image
                src={iconUrl}
                alt=""
                width={44}
                height={44}
                className="size-11 object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <span
                className={`flex size-11 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${tint}`}
              >
                <Icon className="size-5.5" strokeWidth={1.75} />
              </span>
            )}
            <span
              className={`text-sm ${isActive ? "font-semibold text-brand" : "font-medium text-foreground"}`}
            >
              {label}
            </span>
          </>
        );
        const className = `group relative flex min-w-[76px] shrink-0 flex-col items-center gap-1.5 px-2 pb-3 pt-4 after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-full ${
          isActive ? "after:bg-brand" : "after:bg-transparent hover:after:bg-line"
        }`;

        return isActive ? (
          <span key={key} aria-current="page" className={className}>
            {content}
          </span>
        ) : (
          <Link key={key} href={href} className={className}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
