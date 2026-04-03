import { headers } from "next/headers";

import type { AdminAnalyticsData } from "@/lib/analytics/ga4";
import {
  markDatabaseUnavailable,
  prisma,
  shouldBypassDatabase,
} from "@/lib/db";

type RecentBooking = {
  id: string;
  type: "Flight" | "Hotel";
  reference: string;
  status: string;
  amount: string;
  createdAt: string;
};

export default async function AdminPage() {
  const analytics = await getAnalyticsFromApi();
  const recentBookings = await getRecentBookings();

  const durationBars = analytics.durationBars;

  const sourceChart = analytics.sources;

  const sourceGradient = `conic-gradient(${sourceChart
    .map((segment, i) => {
      const start = sourceChart
        .slice(0, i)
        .reduce((acc, current) => acc + current.percent, 0);
      const end = start + segment.percent;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(",")})`;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Administration
          </p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              analytics.configured
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {analytics.configured ? "GA4 Connected" : "Fallback Data"}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-blue-950 sm:text-3xl">
          Performance Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800/80 sm:text-base">
          Review visitor behaviour, sales performance, and acquisition trends
          from a single operational overview.
        </p>
        {analytics.errorReason && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            {analytics.errorReason}
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Total Visitors
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.kpis.visitors.toLocaleString()}
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600">Last 30 days</p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Total Sessions
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.kpis.sessions.toLocaleString()}
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600">Last 30 days</p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Unique Visitors
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.kpis.uniqueVisitors.toLocaleString()}
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600">Last 30 days</p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Avg Session Time
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.kpis.avgSessionTime}
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600">Last 30 days</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Recent Bookings (Flights & Hotels)
          </h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            {recentBookings.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">
                No recent bookings available yet.
              </p>
            ) : (
              recentBookings.map((row, index) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[1fr_0.7fr_0.7fr_0.7fr] items-center gap-2 px-4 py-3 text-sm ${
                    index % 2 === 0 ? "bg-slate-50" : "bg-slate-100/70"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {row.type} booking
                    </p>
                    <p className="text-xs text-slate-500">{row.reference}</p>
                  </div>
                  <p className="text-slate-700">{row.createdAt}</p>
                  <p className="text-slate-700">{row.amount}</p>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {row.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-100">
            Hourly Engagement
          </p>
          <h3 className="mt-2 text-2xl font-semibold">24-hour distribution</h3>
          <p className="mt-1 text-xs text-blue-100">
            Based on GA4 user engagement duration per hour
          </p>

          <div className="mt-5 grid h-44 grid-cols-24 items-end gap-1">
            {durationBars.map((value, i) => (
              <div
                key={i}
                className="rounded-sm bg-white/70"
                style={{ height: `${value}%` }}
                title={`${i}:00`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-blue-100/80">
            <span>00:00</span>
            <span>23:00</span>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">
            Traffic Sources
          </h3>
          <div className="mt-4 flex items-center justify-between gap-4">
            <ul className="space-y-1.5 text-sm">
              {sourceChart.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-slate-700"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{ background: sourceGradient }}
            >
              <div className="h-14 w-14 rounded-full bg-white" />
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

async function getRecentBookings(): Promise<RecentBooking[]> {
  if (shouldBypassDatabase()) {
    return [];
  }

  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return bookings.map(
      (booking: {
        id: string;
        reference: string;
        status: string;
        totalAmount: unknown;
        currency: string;
        flightData: unknown;
        hotelData: unknown;
        createdAt: Date;
      }) => {
        const hasFlight = Boolean(booking.flightData);
        const hasHotel = Boolean(booking.hotelData);
        const type = hasFlight ? "Flight" : hasHotel ? "Hotel" : "Flight";
        const totalAmount = booking.totalAmount?.toString() ?? "0";

        return {
          id: booking.id,
          type,
          reference: booking.reference,
          status: booking.status,
          amount: `${booking.currency} ${totalAmount}`,
          createdAt: new Date(booking.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        };
      },
    );
  } catch (err) {
    markDatabaseUnavailable(err);
    return [];
  }
}

async function getAnalyticsFromApi(): Promise<AdminAnalyticsData> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";

  const fallbackData: AdminAnalyticsData = {
    configured: false,
    source: "fallback",
    durationBars: Array.from({ length: 30 }, (_, i) =>
      Math.max(12, 92 - i * 2),
    ),
    kpis: {
      visitors: 43883,
      sessions: 61520,
      uniqueVisitors: 36740,
      avgSessionTime: "04:12",
    },
    sources: [
      { label: "Direct", color: "#17c8b5", percent: 48 },
      { label: "Social", color: "#9f36f2", percent: 26 },
      { label: "Search", color: "#3b43ff", percent: 16 },
      { label: "Email", color: "#f4b83f", percent: 10 },
    ],
    errorReason:
      "Analytics API could not be reached. Showing fallback analytics.",
  };

  try {
    const res = await fetch(`${protocol}://${host}/api/admin/analytics/ga4`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        ...fallbackData,
        errorReason:
          "Analytics API returned an error response. Showing fallback analytics.",
      };
    }

    const data = (await res.json()) as AdminAnalyticsData;
    return data;
  } catch {
    return fallbackData;
  }
}
