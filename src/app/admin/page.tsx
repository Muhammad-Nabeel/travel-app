import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  Inbox,
  UserCheck,
  Users,
} from "lucide-react";

import { Ga4HealthStatus } from "@/components/admin/ga4-health-status";
import {
  getAdminAnalyticsData,
  unavailableAnalyticsData,
  type AdminAnalyticsData,
} from "@/lib/analytics/ga4";
import {
  markDatabaseUnavailable,
  prisma,
  shouldBypassDatabase,
} from "@/lib/db";

type RecentBooking = {
  id: string;
  type: string;
  reference: string;
  status: string;
  amount: string;
  createdAt: string;
};

export default async function AdminPage() {
  const analytics = await getAnalytics();
  const recentBookings = await getRecentBookings();

  const { kpis, durationBars, sources: sourceChart } = analytics;

  const sourceGradient = `conic-gradient(${sourceChart
    .map((segment, i) => {
      const start = sourceChart
        .slice(0, i)
        .reduce((acc, current) => acc + current.percent, 0);
      const end = start + segment.percent;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(",")})`;

  const kpiCards = [
    {
      label: "Total Visitors",
      value: kpis ? kpis.visitors.toLocaleString() : "N/A",
      icon: Users,
      tint: "bg-brand-soft text-brand",
    },
    {
      label: "Total Sessions",
      value: kpis ? kpis.sessions.toLocaleString() : "N/A",
      icon: Activity,
      tint: "bg-success/8 text-success",
    },
    {
      label: "Unique Visitors",
      value: kpis ? kpis.uniqueVisitors.toLocaleString() : "N/A",
      icon: UserCheck,
      tint: "bg-navy/8 text-navy",
    },
    {
      label: "Avg Session Time",
      value: kpis ? kpis.avgSessionTime : "N/A",
      icon: Clock,
      tint: "bg-gold/10 text-gold-strong",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Performance Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Visitor behaviour, sales performance and acquisition trends at a
            glance.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            analytics.configured
              ? "bg-success/8 text-success"
              : "bg-gold/10 text-gold-strong"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${analytics.configured ? "bg-success" : "bg-gold"}`}
          />
          {analytics.configured
            ? "Live GA4 data · Last 30 days"
            : "GA4 not connected"}
        </span>
      </section>

      {analytics.errorReason && (
        <p className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-strong">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {analytics.errorReason}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, value, icon: Icon, tint }) => (
          <article
            key={label}
            className="rounded-2xl border border-line bg-white p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">{label}</p>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-navy">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="text-base font-semibold text-navy">
              Recent Bookings
            </h2>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-strong"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-muted/70">
                <Inbox className="h-5 w-5" />
              </span>
              <p className="text-sm text-muted">No bookings yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-120 text-sm">
                <thead>
                  <tr className="bg-subtle text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-6 py-2.5">Booking</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="px-6 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentBookings.map((row) => (
                    <tr key={row.id} className="transition hover:bg-subtle/60">
                      <td className="px-6 py-3">
                        <Link
                          href={`/admin/bookings/${row.id}`}
                          className="font-semibold text-navy hover:text-brand"
                        >
                          {row.type} booking
                        </Link>
                        <p className="font-mono text-xs text-muted">
                          {row.reference}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-muted">{row.createdAt}</td>
                      <td className="px-3 py-3 text-right font-semibold text-navy">
                        {row.amount}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="rounded-2xl bg-navy p-6 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            Hourly Engagement
          </p>
          <h2 className="mt-1 text-lg font-semibold">24-hour distribution</h2>
          <p className="mt-1 text-xs text-white/60">
            GA4 user engagement duration per hour
          </p>

          {durationBars.length === 0 ? (
            <div className="mt-6 flex h-44 items-center justify-center rounded-lg border border-dashed border-white/15 text-sm text-white/50">
              No engagement data available
            </div>
          ) : (
            <div className="mt-6 grid h-44 grid-cols-24 items-end gap-1">
              {durationBars.map((value, i) => (
                <div
                  key={i}
                  className="rounded-t-sm bg-[#7fb0ff]/80 transition hover:bg-white"
                  style={{ height: `${value}%` }}
                  title={`${i}:00`}
                />
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-navy">Traffic Sources</h2>
          {sourceChart.length === 0 ? (
            <p className="mt-5 flex h-32 items-center justify-center rounded-lg border border-dashed border-line text-sm text-muted">
              No traffic source data available
            </p>
          ) : (
            <div className="mt-5 flex items-center gap-8">
              <div
                className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                style={{ background: sourceGradient }}
              >
                <div className="h-20 w-20 rounded-full bg-white" />
              </div>
              <ul className="flex-1 space-y-2.5 text-sm">
                {sourceChart.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2.5 text-navy/80"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="flex-1">{item.label}</span>
                    <span className="font-semibold text-navy">
                      {item.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-navy">GA4 Status</h2>
          <div className="mt-4">
            <Ga4HealthStatus />
          </div>
        </article>
      </section>
    </main>
  );
}

function statusTone(status: string) {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return "bg-success/8 text-success";
    case "PENDING":
      return "bg-gold/10 text-gold-strong";
    case "CANCELLED":
    case "FAILED":
      return "bg-deal/6 text-deal";
    default:
      return "bg-line/50 text-navy/80";
  }
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

    return bookings.map((booking) => {
      const type = booking.type.charAt(0) + booking.type.slice(1).toLowerCase();
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
    });
  } catch (err) {
    markDatabaseUnavailable(err);
    return [];
  }
}

async function getAnalytics(): Promise<AdminAnalyticsData> {
  try {
    return await getAdminAnalyticsData();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return unavailableAnalyticsData(
      `Analytics could not be loaded: ${message}`,
    );
  }
}
