"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import {
  ADS_CONVERSIONS,
  GA4_CUSTOM_DIMENSIONS,
  GA4_EVENT_TAGS,
  SERVICE_TRACKING,
  adsTagName,
  type AdsConversionKey,
} from "@/lib/analytics/gtm-plan";

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          })
          .catch(() => setCopied(false));
      }}
      className="inline-flex max-w-full items-center gap-1 rounded-md border border-line bg-white px-1.5 py-0.5 font-mono text-xs text-navy transition hover:bg-subtle"
      title="Copy"
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="size-3 shrink-0 text-success" aria-label="Copied" />
      ) : (
        <Copy className="size-3 shrink-0 text-muted" aria-hidden />
      )}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</p>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

/**
 * Step-by-step GTM / GA4 / Google Ads setup and, per service, the events,
 * triggers, tags and key events it needs. Driven by src/lib/analytics/gtm-plan.ts.
 */
export function GtmSetupGuide({
  provider,
  adsLabels,
  hasAdsId,
}: {
  provider: "ga4" | "gtm";
  adsLabels: Record<AdsConversionKey, string>;
  hasAdsId: boolean;
}) {
  const [serviceKey, setServiceKey] = useState(SERVICE_TRACKING[0].key);
  const service = SERVICE_TRACKING.find((s) => s.key === serviceKey) ?? SERVICE_TRACKING[0];
  const isGtm = provider === "gtm";

  return (
    <div className="grid gap-5 rounded-xl border border-line bg-subtle p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Setup instructions</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-navy/80">
          {isGtm ? (
            <>
              <li>Enter your GTM Container ID and GA4 Measurement ID above. Add Google Ads labels if you run Ads. Then click <b>Save</b>.</li>
              <li>
                Click <b>Download GTM container</b>. In Tag Manager go to <b>Admin → Import Container</b>, choose the
                file, pick your workspace and select <b>Merge → Rename conflicting tags, triggers and variables</b>.
              </li>
              <li>
                The import adds every tag, trigger and variable listed below, for all services. Don&apos;t create
                extra GA4 tags per service: the two GA4 event tags already cover every service, and an extra one
                would count events twice.
              </li>
              <li>
                Click <b>Preview</b> in GTM and run the test for each service (below). Check each tag shows as
                <i> Fired</i>, then <b>Submit → Publish</b>.
              </li>
              <li>Finish in GA4: add the custom dimensions and key events listed below.</li>
            </>
          ) : (
            <>
              <li>Enter the GA4 Measurement ID above and save. The site then sends every event below straight to GA4.</li>
              <li>In GA4, add the custom dimensions and the key events listed for each service below.</li>
              <li>
                Per-service Google Ads tags need Google Tag Manager. Switch the provider to GTM to use them, or
                import the GA4 key events into Google Ads instead.
              </li>
            </>
          )}
        </ol>
      </div>

      {isGtm && (
        <Section title="Tags that cover every service (GA4)">
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="font-semibold text-navy">Google Tag - GA4</p>
              <p className="text-xs text-muted">Google tag with your Measurement ID · Trigger: All Pages</p>
            </div>
            {Object.values(GA4_EVENT_TAGS).map((t) => (
              <div key={t.name} className="rounded-lg border border-line bg-white p-3">
                <p className="font-semibold text-navy">{t.name}</p>
                <p className="text-xs text-muted">
                  GA4 Event, event name <code>{"{{Event}}"}</code> · Trigger: {t.triggerName}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {t.events.map((e) => (
                    <CopyChip key={e} value={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Per service</p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="tablist">
          {SERVICE_TRACKING.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={s.key === service.key}
              onClick={() => setServiceKey(s.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                s.key === service.key
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-navy/80 hover:bg-white/60"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-4 rounded-xl border border-line bg-white p-4" role="tabpanel">
          <p className="text-sm text-muted">{service.summary}</p>

          <Section title="Events the website sends">
            {service.events.map((e) => (
              <div key={`${e.name}-${e.when}`} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                <div className="sm:w-44 sm:shrink-0">
                  <CopyChip value={e.name} />
                </div>
                <p className="text-xs text-navy/80">
                  {e.when}
                  {e.params && <span className="block text-muted">{e.params}</span>}
                </p>
              </div>
            ))}
          </Section>

          {isGtm && (
            <>
              <Section title="GTM triggers (included in the download)">
                {service.triggers.map((t) => (
                  <div key={t.name} className="text-xs">
                    <CopyChip value={t.name} />
                    <p className="mt-0.5 text-muted">Custom Event · {t.condition}</p>
                  </div>
                ))}
              </Section>

              <Section title="GTM tags for this service">
                <p className="text-xs text-navy/80">
                  GA4: handled by <b>{GA4_EVENT_TAGS.standard.name}</b>
                  {service.key === "flights" && (
                    <>
                      {" "}and <b>{GA4_EVENT_TAGS.ecommerce.name}</b>
                    </>
                  )}
                  . Nothing to add.
                </p>
                {service.ads.map((key) => {
                  const conversion = ADS_CONVERSIONS.find((c) => c.key === key)!;
                  const ready = hasAdsId && Boolean(adsLabels[key]);
                  return (
                    <div key={key} className="rounded-lg border border-line p-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-navy">{adsTagName(conversion.label)}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            ready ? "bg-success/10 text-success" : "bg-line/60 text-muted"
                          }`}
                        >
                          {ready ? "Included in download" : "Optional · add Ads label above"}
                        </span>
                      </div>
                      <p className="mt-1 text-muted">
                        Google Ads Conversion Tracking · Trigger: {conversion.triggerName}
                        {conversion.value === "booking" &&
                          " · Value {{DLV - ecommerce.value}}, currency {{DLV - ecommerce.currency}}, order ID {{DLV - ecommerce.transaction_id}}"}
                        {conversion.value === "lead" && " · Value {{DLV - value}}, currency {{DLV - currency}}"}
                      </p>
                    </div>
                  );
                })}
              </Section>
            </>
          )}

          <Section title="GA4 key events (GA4 → Admin → Events → Create event)">
            {service.keyEvents.map((k) => (
              <div key={k.name} className="text-xs">
                <CopyChip value={k.name} />
                <p className="mt-0.5 text-muted">{k.condition}</p>
              </div>
            ))}
            <p className="text-xs text-muted">
              Then mark each one as a key event in GA4 → Admin → Key events. Keep &quot;Copy parameters from the
              source event&quot; ticked.
            </p>
          </Section>

          <Section title="How to test">
            <p className="text-xs text-navy/80">{service.test}</p>
            <p className="text-xs text-muted">
              Test enquiries and bookings are saved for real in Admin → Bookings. Delete them afterwards.
            </p>
          </Section>
        </div>
      </div>

      <Section title="GA4 custom dimensions (Admin → Custom definitions, scope Event)">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {GA4_CUSTOM_DIMENSIONS.map(([label, param]) => (
            <div key={param} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs">
              <span className="text-navy/80">{label}</span>
              <CopyChip value={param} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">
          With <b>Lead type</b> registered, any lead report can be split into Flight, Hotel, Umrah, Tour, Visa and
          Contact.
        </p>
      </Section>

      <p className="text-xs text-muted">
        Not tracked yet: searches for hotels, Umrah, tours and visa; package page views; and online card payments
        (purchase fires for Cash on Delivery and Pay at Branch only).
      </p>
    </div>
  );
}
