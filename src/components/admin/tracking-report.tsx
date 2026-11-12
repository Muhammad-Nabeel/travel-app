"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, RefreshCw } from "lucide-react";

import {
  REPORT_RANGES,
  type ReportRange,
  type TrackingReport as TrackingReportData,
} from "@/lib/analytics/tracking-report-types";

type Loaded = Extract<TrackingReportData, { configured: true }>;

const number = new Intl.NumberFormat("en-US");

function formatCount(value: number | null) {
  return value === null ? "—" : number.format(value);
}

export function TrackingReport() {
  const [days, setDays] = useState<ReportRange>(30);
  const [report, setReport] = useState<TrackingReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (range: ReportRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/tracking-report?days=${range}`, {
        cache: "no-store",
      });
      setReport((await res.json()) as TrackingReportData);
    } catch (err) {
      setReport({
        configured: false,
        reason: err instanceof Error ? err.message : "Could not load the report.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Tracking Report</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Every event the website sends to Google Analytics, how many GA4 received, and
            results per service. Use <b>Live</b> to confirm a test journey within minutes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Date range">
            {REPORT_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                aria-pressed={days === range}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  days === range ? "bg-navy text-white" : "text-navy/70 hover:bg-subtle"
                }`}
              >
                {range} days
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load(days)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy/80 transition hover:bg-subtle disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      {!report ? (
        <p className="rounded-2xl border border-line bg-white p-6 text-sm text-muted shadow-card">
          Loading report…
        </p>
      ) : !report.configured ? (
        <p className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-strong">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {report.reason}
        </p>
      ) : (
        <ReportBody report={report} loading={loading} />
      )}
    </main>
  );
}

function ReportBody({ report, loading }: { report: Loaded; loading: boolean }) {
  const receiving = report.events.filter((e) => e.count > 0).length;

  return (
    <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
      {report.warnings.length > 0 && (
        <ul className="space-y-2">
          {report.warnings.map((warning) => (
            <li
              key={warning}
              className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-strong"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {warning}
            </li>
          ))}
        </ul>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {report.services.map((service) => (
          <article key={service.key} className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold text-navy">{service.label}</h2>
            <dl className="mt-3 grid grid-cols-3 gap-3">
              {service.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs text-muted">{metric.label}</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight text-navy">
                    {formatCount(metric.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-navy">Tag health</h2>
            <p className="text-xs text-muted">
              {receiving} of {report.events.length} events received in the last {report.days} days
            </p>
          </div>
          <p className="text-xs text-muted">
            Updated {new Date(report.generatedAt).toLocaleTimeString()}
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <thead className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Event</th>
                <th className="px-5 py-2.5 font-semibold">Sent when</th>
                <th className="px-5 py-2.5 text-right font-semibold">Last {report.days} days</th>
                <th className="px-5 py-2.5 text-right font-semibold">Live (30 min)</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.events.map((event) => (
                <tr key={event.name}>
                  <td className="px-5 py-3 align-top">
                    <code className="font-semibold text-navy">{event.name}</code>
                    <p className="mt-0.5 text-xs text-muted">{event.services.join(", ")}</p>
                  </td>
                  <td className="px-5 py-3 align-top text-xs text-navy/80">
                    {event.descriptions.join(" · ")}
                  </td>
                  <td className="px-5 py-3 text-right align-top font-semibold text-navy">
                    {number.format(event.count)}
                  </td>
                  <td className="px-5 py-3 text-right align-top text-navy/80">
                    {formatCount(event.liveCount)}
                  </td>
                  <td className="px-5 py-3 align-top">
                    {event.count > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/8 px-2 py-0.5 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Receiving
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold-strong">
                        <CircleDashed className="h-3.5 w-3.5" /> No data yet
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-navy">Flight booking funnel</h2>
          {report.funnel ? (
            <ol className="mt-4 space-y-3">
              {report.funnel.map((step) => (
                <li key={step.event}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-navy">{step.label}</span>
                    <span className="text-navy/80">
                      {number.format(step.count)}{" "}
                      <span className="text-xs text-muted">({step.percent}%)</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-subtle">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, step.percent)}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Needs the <code>search_type</code> custom dimension in GA4 to separate flight searches.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-navy">Other events GA4 received</h2>
          <p className="mt-1 text-xs text-muted">
            Collected automatically by GA4 (page views, scrolls, clicks) rather than sent by the site code.
          </p>
          {report.otherEvents.length === 0 ? (
            <p className="mt-3 text-sm text-muted">None in this period.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {report.otherEvents.map((event) => (
                <li key={event.name} className="flex justify-between gap-2 py-2">
                  <code className="text-navy">{event.name}</code>
                  <span className="font-semibold text-navy">{number.format(event.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-xs text-muted">
        GA4 standard reports can lag 24–48 hours; the Live column is near real time. Counts come
        from the GA4 property set in Admin → Settings → Dashboard Analytics.
      </p>
    </div>
  );
}
