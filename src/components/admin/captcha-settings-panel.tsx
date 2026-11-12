"use client";

import { useEffect, useState } from "react";

import type { CaptchaSettings } from "@/lib/admin-settings/captcha-settings";

const ENDPOINT = "/api/admin/settings/captcha";

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

const EMPTY_FORM: CaptchaSettings = { enabled: false, siteKey: "", secretKey: "" };

/** Cloudflare Turnstile switch and keys (secret stored encrypted). */
export function CaptchaSettingsPanel() {
  const [form, setForm] = useState<CaptchaSettings>(EMPTY_FORM);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  // Only rendered after loading finishes, so the server/client values never meet.
  const [hostname] = useState(() => (typeof window === "undefined" ? "" : window.location.hostname));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(ENDPOINT, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as Omit<CaptchaSettings, "secretKey"> & {
          hasSecretKey?: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Unable to load form protection settings.");
        if (!ignore) {
          setForm({ enabled: json.enabled, siteKey: json.siteKey, secretKey: "" });
          setHasStoredSecret(Boolean(json.hasSecretKey));
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
      if (!res.ok) throw new Error(json.error ?? "Failed to save form protection settings.");
      if (form.secretKey.trim()) setHasStoredSecret(true);
      setForm((prev) => ({ ...prev, secretKey: "" }));
      setMessage(
        form.enabled
          ? "Form protection is on. Public forms now show the security check."
          : "Form protection is off. Forms are protected by rate limits only.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save form protection settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading form protection settings...</p>;

  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Form Protection
      </p>
      <h2 className="text-xl font-semibold text-navy">Spam protection (Cloudflare Turnstile)</h2>
      <p className="text-sm text-muted">
        Adds a security check to sign-up, forgot password, contact, every enquiry
        form, flight booking requests, reviews and the chat request form. Most
        visitors pass it automatically without solving a puzzle.
      </p>

      <label className="flex items-center gap-3 rounded-xl border border-line bg-subtle p-3">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
          className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
        />
        <span>
          <span className="block text-sm font-medium text-navy/80">Enable form protection</span>
          <span className="block text-xs text-muted">Requires a site key and secret key below.</span>
        </span>
      </label>

      <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-gold-strong">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]">Setup (free)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Sign in at dash.cloudflare.com (a free account is enough) and open Turnstile.</li>
          <li>
            Add a widget, set Widget Mode to <strong>Managed</strong>, and add the
            hostname{hostname ? (
              <>
                {" "}
                <code className="rounded bg-white px-1 text-xs">{hostname}</code>
              </>
            ) : null}{" "}
            plus your live domain.
          </li>
          <li>Copy the Site Key and Secret Key here, then enable and save.</li>
        </ol>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Site key</span>
        <input
          value={form.siteKey}
          onChange={(e) => setForm((prev) => ({ ...prev, siteKey: e.target.value }))}
          placeholder="0x4AAAAAAA..."
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Secret key</span>
        <input
          type="password"
          autoComplete="off"
          value={form.secretKey}
          onChange={(e) => setForm((prev) => ({ ...prev, secretKey: e.target.value }))}
          placeholder={hasStoredSecret ? "••••••••" : "0x4AAAAAAA..."}
          className={INPUT_CLASS}
        />
        {hasStoredSecret && (
          <p className="text-xs text-muted">
            A secret key is already saved. Leave this blank to keep it.
          </p>
        )}
      </label>

      {message && (
        <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">{message}</p>
      )}
      {error && <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Form Protection"}
        </button>
      </div>
    </div>
  );
}
