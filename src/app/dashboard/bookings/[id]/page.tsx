import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BookingRequestDetails } from "@/components/features/booking/booking-request-details";
import { formatBookingAmount } from "@/lib/bookings/amount";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES } from "@/lib/bookings/status";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/providers/auth/auth-provider";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Booking Details",
  description: "Details and current status of your booking.",
  path: "/dashboard",
  noIndex: true,
});

export default async function UserBookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect(`/signin?callbackUrl=/dashboard/bookings/${id}`);
  }

  // Scoped to the signed-in user: other people's bookings are a 404.
  const booking = await prisma.booking.findFirst({
    where: { id, userId },
    select: {
      reference: true,
      type: true,
      channel: true,
      status: true,
      title: true,
      totalAmount: true,
      currency: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      payload: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!booking) {
    notFound();
  }

  const summary: Array<[string, string]> = [
    ["Type", booking.type.charAt(0) + booking.type.slice(1).toLowerCase()],
    ["Amount", formatBookingAmount(booking.totalAmount, booking.currency)],
    ["Submitted", booking.createdAt.toLocaleString("en-GB")],
    ["Last updated", booking.updatedAt.toLocaleString("en-GB")],
    ["Name", booking.customerName ?? "-"],
    ["Email", booking.customerEmail ?? "-"],
    ["Phone", booking.customerPhone ?? "-"],
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">
        ← Back to my bookings
      </Link>

      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              {booking.reference}
            </p>
            <h1 className="mt-2 break-words text-xl font-semibold text-blue-950 sm:text-2xl">
              {booking.title ?? "Booking details"}
            </h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${BOOKING_STATUS_TONES[booking.status]}`}
          >
            {BOOKING_STATUS_LABELS[booking.status]}
          </span>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {summary.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</dt>
              <dd className="mt-0.5 break-words text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Request details</h2>
        <BookingRequestDetails channel={booking.channel} payload={booking.payload} />
      </section>
    </div>
  );
}
