import Link from "next/link";
import {
  CreditCard,
  Lock,
  Mail,
  MapPin,
  PhoneCall,
  PlaneTakeoff,
} from "lucide-react";

const columns = [
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
      { href: "/contact-us", label: "Contact us" },
      { href: "/arrange-a-call", label: "Arrange a call" },
      { href: "/faq", label: "FAQ" },
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

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line bg-subtle text-foreground">
      <div className="section-shell grid gap-10 py-12 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-sm space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
              <PlaneTakeoff className="size-4" />
            </span>
            <span className="text-xl font-bold tracking-tight">Safar</span>
          </Link>
          <p className="text-sm leading-6 text-muted">
            Trusted travel support for flights, hotels, and Umrah journeys with
            24/7 live assistance.
          </p>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-brand" />
              <a href="mailto:support@safartravel.com" className="hover:text-brand">
                support@safartravel.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <PhoneCall className="size-4 text-brand" />
              +44 7933 837137 · +92 307 2477709
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-brand" />
              London, UK · Lahore, PK
            </li>
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
                      className="text-sm text-muted transition hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="section-shell flex flex-col gap-3 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Safar Travel. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5" />
              Secure payments
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="size-3.5" />
              Visa · Mastercard
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
