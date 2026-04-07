import type { Metadata } from "next";

import { PaymentPageClient } from "@/components/features/booking/payment-page-client";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Payment",
  description: "Complete your booking by selecting a payment method.",
  path: "/flights/payment",
  noIndex: true,
});

export default function PaymentPage() {
  return (
    <main className="flex-1">
      <PaymentPageClient />
    </main>
  );
}
