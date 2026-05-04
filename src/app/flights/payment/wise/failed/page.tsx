import Link from "next/link";
import type { Metadata } from "next";

import { getWiseReturnSnapshot } from "@/lib/payments/wise-return";
import { buildMetadata } from "@/lib/seo";
import { WiseReturnLogger } from "@/components/features/booking/wise-return-logger";

export const metadata: Metadata = buildMetadata({
  title: "Wise Payment Failed",
  description: "Your Wise payment did not complete. Retry checkout safely.",
  path: "/flights/payment/wise/failed",
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

export default async function WisePaymentFailedPage({
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
        page="failed"
      />
      <section className="w-full rounded-3xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Payment Update
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Wise Payment Not Completed
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The payment did not finish. You can retry checkout from support/admin
          without losing your booking reference.
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
            {snapshot ? formatStatus(snapshot.paymentStatus) : "Failed"}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/flights/payment"
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Back To Payment
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
