"use client";

import { useEffect, useState } from "react";

import type { ErrorTrackingSettings } from "@/lib/admin-settings/error-tracking-settings";

const ENDPOINT = "/api/admin/settings/error-tracking";

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

const EMPTY_FORM: ErrorTrackingSettings = {
  enabled: false,
  dsn: "",
  environment: "production",
  tracesSampleRate: 0,
};

/** Sentry DSN and switches, plus a button to send a test error. */
export function ErrorTrackingSettingsPanel() {
  const [form, setForm] = useState<ErrorTrackingSettings>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(ENDPOINT, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as ErrorTrackingSettings & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Unable to load error tracking settings.");
        if (!ignore) setForm({ ...EMPTY_FORM, ...json });
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
      if (!res.ok) throw new Error(json.error ?? "Failed to save error tracking settings.");
      setMessage(
        form.enabled
          ? "Error tracking is on. Use “Send test error” to confirm events reach Sentry."
          : "Error tracking is off. Nothing is sent to Sentry.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save error tracking settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`${ENDPOINT}/test`, { method: "POST" });
      const json = (await res.json()) as { eventId?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to send a test error.");
      setMessage(`Test error sent (event ${json.eventId}). It should appear in Sentry → Issues within a minute.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send a test error.");
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading error tracking settings...</p>;

  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Error Tracking</p>
      <h2 className="text-xl font-semibold text-navy">Issue tracking (Sentry)</h2>
      <p className="text-sm text-muted">
        Reports crashes and failed requests from the website and server to Sentry,
        so problems (a failed booking, an email that didn&apos;t send, a Sabre outage)
        are noticed before customers call. Passwords, passenger details, contact
        details, cookies and request bodies are never sent.
      </p>

      <label className="flex items-center gap-3 rounded-xl border border-line bg-subtle p-3">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
          className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
        />
        <span>
          <span className="block text-sm font-medium text-navy/80">Enable error tracking</span>
          <span className="block text-xs text-muted">Requires the DSN below.</span>
        </span>
      </label>

      <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-gold-strong">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]">Setup</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Create a free account at sentry.io and a project of type Next.js.</li>
          <li>Open Project Settings → Client Keys (DSN) and copy the DSN here.</li>
          <li>Enable, save, then press “Send test error”.</li>
        </ol>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">DSN</span>
        <input
          value={form.dsn}
          onChange={(e) => setForm((prev) => ({ ...prev, dsn: e.target.value }))}
          placeholder="https://abc123@o123456.ingest.sentry.io/7890"
          className={INPUT_CLASS}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Environment</span>
          <input
            value={form.environment}
            onChange={(e) => setForm((prev) => ({ ...prev, environment: e.target.value }))}
            placeholder="production"
            className={INPUT_CLASS}
          />
          <span className="text-xs text-muted">Use “staging” on a test site to keep its errors apart.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Performance tracing</span>
          <select
            value={String(form.tracesSampleRate)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tracesSampleRate: Number(e.target.value) }))
            }
            className={INPUT_CLASS}
          >
            <option value="0">Off (errors only)</option>
            <option value="0.05">5% of visits</option>
            <option value="0.1">10% of visits</option>
            <option value="0.25">25% of visits</option>
          </select>
          <span className="text-xs text-muted">Tracing uses more of Sentry&apos;s free quota.</span>
        </label>
      </div>

      {message && (
        <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">{message}</p>
      )}
      {error && <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={testing || saving}
          className="rounded-xl border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-subtle disabled:opacity-70"
        >
          {testing ? "Sending..." : "Send test error"}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Error Tracking"}
        </button>
      </div>
    </div>
  );
}
