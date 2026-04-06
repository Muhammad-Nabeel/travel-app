import { PaymentPageClient } from "@/components/features/booking/payment-page-client";

export const metadata = {
  title: "Payment — Travel App",
  description: "Complete your flight booking by selecting a payment method.",
};

export default function PaymentPage() {
  return (
    <main className="flex-1">
      <PaymentPageClient />
    </main>
  );
}
