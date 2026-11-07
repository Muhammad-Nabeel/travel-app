"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/ga4-events";

type ContactMethod = "whatsapp" | "phone" | "email";

function getContactMethod(href: string): ContactMethod | null {
  const value = href.trim().toLowerCase();

  if (value.startsWith("tel:")) return "phone";
  if (value.startsWith("mailto:")) return "email";
  if (
    value.startsWith("whatsapp:") ||
    /^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|web\.whatsapp\.com)\//.test(value)
  ) {
    return "whatsapp";
  }

  return null;
}

/**
 * Sends `contact_click` for every WhatsApp, phone and email link on the site,
 * via one delegated listener, so new links are covered without extra code.
 * Only the method is sent, never the number or address.
 */
export function ContactClickTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]");
      if (!link) return;

      const method = getContactMethod(link.getAttribute("href") ?? "");
      if (!method) return;

      trackEvent("contact_click", { method });
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
