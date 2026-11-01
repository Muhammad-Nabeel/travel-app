import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/providers/auth/auth-provider";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "My Dashboard",
  description: "View your personal booking history and statuses.",
  path: "/dashboard",
  noIndex: true,
});

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as
    | { id?: string; role?: string }
    | undefined;

  if (!sessionUser?.id) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  if (sessionUser.role === "ADMIN") {
    redirect("/admin");
  }

  const userId = sessionUser.id;

  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reference: true,
      type: true,
      status: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
    },
    take: 50,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          User Area
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-blue-950 sm:text-3xl">
          My Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800/80 sm:text-base">
          Your personal view of bookings. Only your own records are shown here.
        </p>
      </section>

      {bookings.length === 0 ? (
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No bookings yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Once you create a booking, it will appear in this dashboard.
          </p>
          <div className="mt-4">
            <Link
              href="/flights"
              className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              Find flights
            </Link>
          </div>
        </section>
      ) : null}

      {bookings.length > 0 ? (
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            My Bookings
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-170 text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-2 py-3 font-medium">Reference</th>
                  <th className="px-2 py-3 font-medium">Status</th>
                  <th className="px-2 py-3 font-medium">Type</th>
                  <th className="px-2 py-3 font-medium">Amount</th>
                  <th className="px-2 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100">
                    <td className="px-2 py-3 font-medium text-slate-900">
                      {booking.reference}
                    </td>
                    <td className="px-2 py-3 text-slate-700">
                      {booking.status}
                    </td>
                    <td className="px-2 py-3 text-slate-700">
                      {booking.type}
                    </td>
                    <td className="px-2 py-3 text-slate-700">
                      {booking.totalAmount?.toString() ?? "-"} {booking.currency}
                    </td>
                    <td className="px-2 py-3 text-slate-700">
                      {booking.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

    </div>
  );
}
