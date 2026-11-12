"use client";

import dynamic from "next/dynamic";

/**
 * The floating WhatsApp / chat / review buttons (and the review and chat
 * forms behind them) are loaded after the page is interactive. They are not
 * needed for the first paint, so their ~700 lines stay out of every page's
 * initial JavaScript, which keeps the main page quick to respond on phones.
 */
const FloatingReviewWidget = dynamic(
  () =>
    import("@/components/shared/floating-review-widget").then(
      (mod) => mod.FloatingReviewWidget,
    ),
  { ssr: false },
);

export function FloatingReviewWidgetLazy({ whatsappLink }: { whatsappLink: string | null }) {
  return <FloatingReviewWidget whatsappLink={whatsappLink} />;
}
