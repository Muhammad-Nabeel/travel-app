"use client";

import { useEffect, useState } from "react";

import type { DashboardAnalyticsSettings } from "@/lib/admin-settings/ga4-settings";

const ENDPOINT = "/api/admin/settings/dashboard-analytics";

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

const EMPTY_FORM: DashboardAnalyticsSettings = {
  propertyId: "",
  serviceAccountEmail: "",
  serviceAccountPrivateKey: "",
};

/** GA4 Data API credentials for the admin dashboard reports, stored encrypted and separately from the site tag. */
export function DashboardAnalyticsPanel() {
  const [form, setForm] = useState<DashboardAnalyticsSettings>(EMPTY_FORM);
  const [hasStoredPrivateKey, setHasStoredPrivateKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(ENDPOINT, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as Omit<DashboardAnalyticsSettings, "serviceAccountPrivateKey"> & {
          hasPrivateKey?: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Unable to load dashboard analytics settings.");
        if (!ignore) {
          setForm({
            propertyId: json.propertyId,
            serviceAccountEmail: json.serviceAccountEmail,
            serviceAccountPrivateKey: "",
          });
          setHasStoredPrivateKey(Boolean(json.hasPrivateKey));
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
    setBusy("save");
    setMessage("");
    setError("");
    try {
      const res = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save dashboard analytics settings.");
      if (form.serviceAccountPrivateKey.trim()) setHasStoredPrivateKey(true);
      setForm((prev) => ({ ...prev, serviceAccountPrivateKey: "" }));
      setMessage("Dashboard analytics credentials saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save dashboard analytics settings.");
    } finally {
      setBusy(null);
    }
  }

  async function handleTest() {
    setBusy("test");
    setMessage("");
    setError("");
    try {
      const res = await fetch(`${ENDPOINT}?test=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) throw new Error(json.message ?? "GA4 connection test failed.");
      setMessage(json.message ?? "GA4 connection is successful.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "GA4 connection test failed.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading dashboard analytics...</p>;

  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Dashboard Analytics
      </p>
      <h2 className="text-xl font-semibold text-navy">Admin Dashboard Reporting</h2>
      <p className="text-sm text-muted">
        GA4 property and service account the admin dashboard reads visitor
        reports from. This does not change the tag loaded on the website.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Property ID</span>
        <input
          value={form.propertyId}
          onChange={(e) => setForm((prev) => ({ ...prev, propertyId: e.target.value }))}
          placeholder="123456789"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Service Account Email</span>
        <input
          value={form.serviceAccountEmail}
          onChange={(e) => setForm((prev) => ({ ...prev, serviceAccountEmail: e.target.value }))}
          placeholder="analytics-reader@project.iam.gserviceaccount.com"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Service Account Private Key</span>
        <textarea
          value={form.serviceAccountPrivateKey}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, serviceAccountPrivateKey: e.target.value }))
          }
          placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
          className={`min-h-40 ${INPUT_CLASS}`}
        />
        {hasStoredPrivateKey && (
          <p className="text-xs text-muted">
            A private key is already saved. Leave this blank to keep it.
          </p>
        )}
      </label>

      {message && (
        <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">{message}</p>
      )}
      {error && <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={busy !== null}
          className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft disabled:opacity-70"
        >
          {busy === "test" ? "Testing..." : "Test Connection"}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy !== null}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
        >
          {busy === "save" ? "Saving..." : "Save Dashboard Analytics"}
        </button>
      </div>
    </div>
  );
}
