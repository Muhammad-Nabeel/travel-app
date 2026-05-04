import Link from "next/link";
import type { Metadata } from "next";

import { getWiseReturnSnapshot } from "@/lib/payments/wise-return";
import { buildMetadata } from "@/lib/seo";
import { WiseReturnLogger } from "@/components/features/booking/wise-return-logger";

export const metadata: Metadata = buildMetadata({
  title: "Wise Payment Success",
  description: "Review your Wise payment result and booking status.",
  path: "/flights/payment/wise/success",
  noIndex: true,
});

function formatStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readParam(
  source: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = source[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function WisePaymentSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) ?? {};
  const bookingReference = readParam(resolved, "booking_reference").trim();
  const snapshot = await getWiseReturnSnapshot(bookingReference);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10">
      <WiseReturnLogger
        bookingReference={snapshot?.reference || bookingReference}
        page="success"
      />
      <section className="w-full rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Payment Update
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Wise Payment Submitted
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Thank you. Your payment response has been received and we are syncing
          final status.
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Reference:</span>{" "}
            {snapshot?.reference || bookingReference || "Not provided"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-slate-900">Booking Status:</span>{" "}
            {snapshot ? formatStatus(snapshot.bookingStatus) : "Pending"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-slate-900">Payment Status:</span>{" "}
            {snapshot ? formatStatus(snapshot.paymentStatus) : "Pending Checkout"}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Back To Home
          </Link>
          <Link
            href="/flights"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Search Flights
          </Link>
        </div>
      </section>
    </main>
  );
}
