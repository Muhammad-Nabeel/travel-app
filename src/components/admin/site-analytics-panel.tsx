"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { GtmSetupGuide } from "@/components/admin/gtm-setup-guide";
import type { SiteAnalyticsSettings } from "@/lib/admin-settings/ga4-settings";
import { ADS_CONVERSIONS, ADS_CONVERSION_KEYS } from "@/lib/analytics/gtm-plan";

const ENDPOINT = "/api/admin/settings/site-analytics";

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-line/50 disabled:text-muted/70";

const EMPTY_FORM: SiteAnalyticsSettings = {
  provider: "ga4",
  gtmContainerId: "",
  measurementId: "",
  adsConversionId: "",
  adsConversionLabels: Object.fromEntries(
    ADS_CONVERSION_KEYS.map((key) => [key, ""]),
  ) as SiteAnalyticsSettings["adsConversionLabels"],
};

/** Tracking tag (GA4 or GTM) loaded on every public page. Saved separately from dashboard reporting. */
export function SiteAnalyticsPanel() {
  const [form, setForm] = useState<SiteAnalyticsSettings>(EMPTY_FORM);
  const [saved, setSaved] = useState<SiteAnalyticsSettings>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(ENDPOINT, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as SiteAnalyticsSettings & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Unable to load site analytics settings.");
        if (!ignore) {
          const loaded: SiteAnalyticsSettings = {
            provider: json.provider,
            gtmContainerId: json.gtmContainerId,
            measurementId: json.measurementId,
            adsConversionId: json.adsConversionId,
            adsConversionLabels: { ...EMPTY_FORM.adsConversionLabels, ...json.adsConversionLabels },
          };
          setForm(loaded);
          setSaved(loaded);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Unable to load settings.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save site analytics settings.");
      setSaved(form);
      setMessage(
        form.provider === "gtm"
          ? "Google Tag Manager settings saved. Download the container to import the tags."
          : "Site GA4 tag saved.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save site analytics settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading site analytics...</p>;

  const isGtm = form.provider === "gtm";
  const unsaved = JSON.stringify(form) !== JSON.stringify(saved);

  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Site Analytics
      </p>
      <h2 className="text-xl font-semibold text-navy">Website Tracking Tag</h2>
      <p className="text-sm text-muted">
        The tag loaded on every public page (flights, hotels, Umrah, tours, visa
        and payment). Dashboard reporting credentials are saved separately
        under Dashboard Analytics.
      </p>

      <div className="grid gap-2 rounded-xl border border-line bg-subtle p-3 sm:grid-cols-2">
        {(
          [
            ["ga4", "Google Analytics 4"],
            ["gtm", "Google Tag Manager"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-navy/80"
          >
            <input
              type="radio"
              name="site-analytics-provider"
              checked={form.provider === value}
              onChange={() => setForm((prev) => ({ ...prev, provider: value }))}
              className="h-4 w-4 border-line-strong text-brand"
            />
            {label}
          </label>
        ))}
      </div>

      {isGtm && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">GTM Container ID</span>
          <input
            value={form.gtmContainerId}
            onChange={(e) => setForm((prev) => ({ ...prev, gtmContainerId: e.target.value }))}
            placeholder="GTM-XXXXXXX"
            className={INPUT_CLASS}
          />
          <p className="text-xs text-muted">Loaded on every page. All tags run inside this container.</p>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">GA4 Measurement ID</span>
        <input
          value={form.measurementId}
          onChange={(e) => setForm((prev) => ({ ...prev, measurementId: e.target.value }))}
          placeholder="G-XXXXXXXXXX"
          className={INPUT_CLASS}
        />
        <p className="text-xs text-muted">
          {isGtm
            ? "Not loaded by the site directly: it is filled into the GA4 tags of the GTM container download."
            : "Loaded on every page with gtag.js."}
        </p>
      </label>

      {isGtm && (
        <details className="rounded-xl border border-line p-3" open={Boolean(form.adsConversionId)}>
          <summary className="cursor-pointer text-sm font-semibold text-navy">
            Google Ads conversions per service (optional)
          </summary>
          <p className="mt-2 text-xs text-muted">
            In Google Ads create one conversion action per service (Goals → Conversions → New → Website → set up
            manually with Google Tag Manager) and paste its Conversion ID and Label here. Each filled label adds
            a Google Ads conversion tag, with the right trigger, to the container download. Leave labels blank
            for services you don&apos;t advertise, or if you import GA4 key events into Ads instead (don&apos;t do both).
          </p>
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Conversion ID</span>
            <input
              value={form.adsConversionId}
              onChange={(e) => setForm((prev) => ({ ...prev, adsConversionId: e.target.value }))}
              placeholder="AW-123456789"
              className={INPUT_CLASS}
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ADS_CONVERSIONS.map((conversion) => (
              <label key={conversion.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">{conversion.label} label</span>
                <input
                  value={form.adsConversionLabels[conversion.key]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      adsConversionLabels: {
                        ...prev.adsConversionLabels,
                        [conversion.key]: e.target.value,
                      },
                    }))
                  }
                  placeholder="AbC-D_efG-h12_34-567"
                  className={INPUT_CLASS}
                />
              </label>
            ))}
          </div>
        </details>
      )}

      {message && (
        <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">{message}</p>
      )}
      {error && <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {isGtm && unsaved && (
          <span className="text-xs text-muted">Save first: the download uses saved settings.</span>
        )}
        {isGtm && (
          <a
            href={unsaved ? undefined : `${ENDPOINT}/container`}
            aria-disabled={unsaved}
            className={`inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft ${
              unsaved ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <Download className="size-4" aria-hidden />
            Download GTM container
          </a>
        )}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Site Analytics"}
        </button>
      </div>

      <GtmSetupGuide
        provider={form.provider}
        adsLabels={saved.adsConversionLabels}
        hasAdsId={Boolean(saved.adsConversionId)}
      />
    </div>
  );
}
