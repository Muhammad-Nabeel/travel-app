import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { headers } from "next/headers";

import type { AdminAnalyticsData } from "@/lib/analytics/ga4";

type SparklineProps = {
  points: number[];
  lineColor: string;
  fillColor: string;
};

function Sparkline({ points, lineColor, fillColor }: SparklineProps) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;

  const normalized = points.map((point, i) => {
    const x = (i / (points.length - 1 || 1)) * 100;
    const y = 100 - ((point - min) / span) * 75 - 10;
    return { x, y };
  });

  const linePath = normalized.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `0,100 ${linePath} 100,100`;

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-28 w-full"
      preserveAspectRatio="none"
    >
      <polygon points={areaPath} fill={fillColor} />
      <polyline
        points={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default async function AdminPage() {
  const analytics = await getAnalyticsFromApi();

  const transactions = [
    { name: "Cy Ganderton", date: "Feb 2nd", amount: "180 USD", trend: "up" },
    { name: "Hart Hagerty", date: "Sep 2nd", amount: "250 USD", trend: "up" },
    { name: "Jim Hagerty", date: "Sep 2nd", amount: "250 USD", trend: "up" },
    { name: "Hart Hagerty", date: "Sep 2nd", amount: "250 USD", trend: "down" },
    { name: "Hart Hagerty", date: "Sep 2nd", amount: "250 USD", trend: "down" },
    { name: "Brice Swyre", date: "Jul 2nd", amount: "320 USD", trend: "up" },
  ] as const;

  const revenueBars = analytics.revenueBars;

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
            Dashboard
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
        <h1 className="mt-2 text-3xl font-extrabold text-blue-950 sm:text-4xl">
          Website Performance Overview
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800/80 sm:text-base">
          Live operational snapshot with visitor metrics, sales trend, and top
          user intent signals from search activity.
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
          <p className="mt-2 text-xs font-medium text-blue-600">
            +12.4% vs last 30 days
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Total Sales
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.kpis.sales}
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600">
            +8.1% vs last 30 days
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Conversion Rate
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.kpis.conversionRate}
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600">
            +0.5% points uplift
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Avg Session Time
          </p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.kpis.avgSessionTime}
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600">
            +6.3% engagement growth
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Transactions
          </h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            {transactions.map((row, index) => (
              <div
                key={`${row.name}-${index}`}
                className={`grid grid-cols-[1.1fr_0.8fr_0.9fr] items-center px-4 py-3 text-sm ${
                  index % 2 === 0 ? "bg-slate-50" : "bg-slate-100/70"
                }`}
              >
                <p className="font-medium text-slate-700">{row.name}</p>
                <p className="text-slate-700">{row.date}</p>
                <div className="flex items-center gap-1.5 text-slate-800">
                  {row.trend === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-300" />
                  )}
                  <span>{row.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-100">
            Revenue
          </p>
          <h3 className="mt-2 text-3xl font-extrabold">21,500 USD</h3>
          <p className="mt-1 text-xs text-blue-100">Revenue report -&gt;</p>

          <div className="mt-5 grid h-44 grid-cols-20 items-end gap-1.5">
            {revenueBars.map((value, i) => (
              <div
                key={i}
                className="rounded-sm bg-white/65"
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h3 className="text-3xl font-extrabold text-slate-900">Sources</h3>
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

        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-4xl font-extrabold text-slate-900">19,000</p>
          <p className="mt-1 text-2xl text-slate-700">Downloads</p>
          <div className="mt-3 overflow-hidden rounded-xl bg-teal-100/40">
            <Sparkline
              points={[
                22, 20, 15, 30, 33, 38, 35, 35, 35, 37, 42, 39, 42, 37, 44, 39,
                46, 43, 32, 35,
              ]}
              lineColor="#0fc5b0"
              fillColor="#b7ddd9"
            />
          </div>
        </article>

        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-4xl font-extrabold text-slate-900">32,800</p>
          <p className="mt-1 text-2xl text-slate-700">Unique visitors</p>
          <div className="mt-3 overflow-hidden rounded-xl bg-violet-100/40">
            <Sparkline
              points={[
                33, 30, 33, 20, 35, 40, 36, 29, 33, 31, 42, 44, 40, 42, 48, 36,
                38, 34, 32, 36,
              ]}
              lineColor="#9334f2"
              fillColor="#d2c0e6"
            />
          </div>
        </article>
      </section>
    </main>
  );
}

async function getAnalyticsFromApi(): Promise<AdminAnalyticsData> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";

  const fallbackData: AdminAnalyticsData = {
    configured: false,
    source: "fallback",
    revenueBars: [
      52, 43, 52, 18, 57, 69, 61, 43, 52, 48, 73, 78, 69, 73, 86, 61, 65, 57,
      52, 61,
    ],
    kpis: {
      visitors: 43883,
      sales: "PKR 9.8M",
      conversionRate: "3.7%",
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
