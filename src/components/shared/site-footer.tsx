import Image from "next/image";
import Link from "next/link";
import { PlaneTakeoff } from "lucide-react";

import type { PublicBrand } from "@/lib/admin-settings/brand-settings";
import type { BrandAssetSlot } from "@/lib/brand-assets";
import {
  getPrimaryPhone,
  type SupportContactSettings,
} from "@/lib/admin-settings/support-contact-settings";

type FooterLink = { href: string; label: string; icon?: BrandAssetSlot };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Company",
    links: [
      { href: "/about-us", label: "About us" },
      { href: "/careers", label: "Careers" },
      { href: "/blog", label: "Travel blog" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/flights", label: "Flights" },
      { href: "/umrah-packages", label: "Umrah packages" },
      { href: "/tour-packages", label: "Tour packages" },
      { href: "/hotels", label: "Hotels" },
      { href: "/visa", label: "Visa services" },
      { href: "/activities", label: "Things to do" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/contact-us", label: "Contact us", icon: "footerContactUs" },
      {
        href: "/arrange-a-call",
        label: "Arrange a call",
        icon: "footerArrangeCall",
      },
      { href: "/faq", label: "FAQ", icon: "footerFaq" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/terms-conditions", label: "Terms & conditions" },
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/refund-policy", label: "Refund policy" },
      { href: "/cookie-policy", label: "Cookie policy" },
    ],
  },
];

/** Admin-uploaded footer icon from Media → Brand & Icons; nothing when unset. */
function FooterIcon({
  brand,
  slot,
  size = 20,
}: {
  brand: PublicBrand;
  slot: BrandAssetSlot;
  size?: number;
}) {
  const src = brand.assets[slot];
  if (!src) return null;

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export function SiteFooter({
  brand,
  contact,
}: {
  brand: PublicBrand;
  contact: SupportContactSettings;
}) {
  const year = new Date().getFullYear();
  const phone = getPrimaryPhone(contact);
  const whatsapp =
    contact.whatsappNumber && contact.whatsappNumber !== phone
      ? contact.whatsappNumber
      : "";

  return (
    <footer className="mt-16 border-t border-line bg-subtle text-foreground">
      <div className="section-shell grid gap-10 py-12 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-sm space-y-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label={`${brand.name} home`}
          >
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt={`${brand.name} logo`}
                width={160}
                height={36}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <>
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
                  <PlaneTakeoff className="size-4" />
                </span>
                <span className="text-xl font-bold tracking-tight">
                  {brand.name}
                </span>
              </>
            )}
          </Link>
          <p className="text-sm leading-6 text-muted">
            Trusted travel support for flights, hotels, and Umrah journeys with
            24/7 live assistance.
          </p>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <FooterIcon brand={brand} slot="footerEmail" />
              <a href={`mailto:${contact.email}`} className="hover:text-brand">
                {contact.email}
              </a>
            </li>
            {phone ? (
              <li className="flex items-center gap-2">
                <FooterIcon brand={brand} slot="footerPhone" />
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="hover:text-brand"
                >
                  {phone}
                </a>
              </li>
            ) : null}
            {whatsapp ? (
              <li className="flex items-center gap-2">
                <FooterIcon brand={brand} slot="footerWhatsapp" />
                {whatsapp}
              </li>
            ) : null}
            {contact.address ? (
              <li className="flex items-center gap-2">
                <FooterIcon brand={brand} slot="footerAddress" />
                {contact.address}
              </li>
            ) : null}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-3 text-sm font-semibold">{column.title}</h2>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-brand"
                    >
                      {link.icon ? (
                        <FooterIcon brand={brand} slot={link.icon} size={18} />
                      ) : null}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {brand.footerBadges.length > 0 ? (
        <div className="border-t border-line">
          <ul
            aria-label="Payments and accreditations"
            className="section-shell flex flex-wrap items-center justify-center gap-3 py-5"
          >
            {brand.footerBadges.map((badge) => (
              <li key={badge.url}>
                <Image
                  src={badge.url}
                  alt={badge.label}
                  width={84}
                  height={36}
                  className="h-9 w-auto object-contain"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-t border-line">
        <div className="section-shell flex flex-col gap-3 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.name}. All rights reserved.
          </p>
          <p className="sm:text-center">
            Powered by{" "}
            <a
              href="https://aimdigitallimited.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground transition hover:text-brand"
            >
              AIM DIGITAL UK LIMITED
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
