import Link from "next/link";
import { Mail, MapPin, PhoneCall, PlaneTakeoff } from "lucide-react";

const quickLinks = [
  { href: "/about-us", label: "About Us" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/arrange-a-call", label: "Arrange a Call" },
  { href: "/faq", label: "FAQ" },
  { href: "/careers", label: "Careers" },
  { href: "/admin", label: "Admin" },
];

const serviceLinks = [
  { href: "/flights", label: "Flight Booking" },
  { href: "/hotels", label: "Hotel Booking" },
  { href: "/umrah-packages", label: "Custom Umrah Plans" },
  { href: "/", label: "Visa Assistance" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-base-300 bg-base-200/70 text-base-content">
      <div className="section-shell py-10">
        <div className="footer gap-8 md:footer-horizontal">
          <aside className="max-w-sm gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary p-2 text-primary-content">
                <PlaneTakeoff className="size-4" />
              </span>
              <p className="display-font text-3xl leading-none">Safar</p>
            </div>
            <p className="text-sm leading-6 text-base-content/70">
              Trusted travel support for flights, hotels, and Umrah journeys
              with 24/7 live assistance.
            </p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                support@safartravel.com
              </p>
              <p className="flex items-center gap-2">
                <PhoneCall className="size-4 text-primary" />
                +44 7933 837137 · +92 307 2477709
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                London, UK · Lahore, PK
              </p>
            </div>
          </aside>

          <nav>
            <h6 className="footer-title">Quick Links</h6>
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="link link-hover"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav>
            <h6 className="footer-title">Services</h6>
            {serviceLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="link link-hover"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav>
            <h6 className="footer-title">Legal</h6>
            <Link href="/terms-conditions" className="link link-hover">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="link link-hover">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="link link-hover">
              Refund Policy
            </Link>
            <Link href="/cookie-policy" className="link link-hover">
              Cookie Policy
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t border-base-300/70 bg-base-100/70">
        <div className="section-shell flex flex-col gap-2 py-4 text-xs text-base-content/70 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {year} Safar Travel. All rights reserved.</p>
          <p>Built for secure bookings and assisted travel planning.</p>
        </div>
      </div>
    </footer>
  );
}
