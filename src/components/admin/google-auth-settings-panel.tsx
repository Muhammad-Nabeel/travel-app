"use client";

import { useEffect, useState } from "react";

import type { GoogleAuthSettings } from "@/lib/admin-settings/google-auth-settings";

const ENDPOINT = "/api/admin/settings/google-auth";

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

const EMPTY_FORM: GoogleAuthSettings = { enabled: false, clientId: "", clientSecret: "" };

/** Turns "Continue with Google" on or off and stores the OAuth client (secret encrypted). */
export function GoogleAuthSettingsPanel() {
  const [form, setForm] = useState<GoogleAuthSettings>(EMPTY_FORM);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  // Only rendered after loading finishes, so the server/client values never meet.
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(ENDPOINT, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as Omit<GoogleAuthSettings, "clientSecret"> & {
          hasClientSecret?: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Unable to load Google sign-in settings.");
        if (!ignore) {
          setForm({ enabled: json.enabled, clientId: json.clientId, clientSecret: "" });
          setHasStoredSecret(Boolean(json.hasClientSecret));
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

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1200);
    } catch {
      setCopied("");
    }
  }

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
      if (!res.ok) throw new Error(json.error ?? "Failed to save Google sign-in settings.");
      if (form.clientSecret.trim()) setHasStoredSecret(true);
      setForm((prev) => ({ ...prev, clientSecret: "" }));
      setMessage(
        form.enabled
          ? "Google sign-in is enabled on the sign-in and sign-up pages."
          : "Google sign-in is turned off.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Google sign-in settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading Google sign-in settings...</p>;

  const callbackUrl = `${origin}/api/auth/callback/google`;

  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Google Sign-In
      </p>
      <h2 className="text-xl font-semibold text-navy">Continue with Google</h2>
      <p className="text-sm text-muted">
        Let customers sign in and sign up with their Google account. When this
        is off, the Google button is hidden and only email sign-in is offered.
      </p>

      <label className="flex items-center gap-3 rounded-xl border border-line bg-subtle p-3">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
          className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
        />
        <span>
          <span className="block text-sm font-medium text-navy/80">Enable Google sign-in</span>
          <span className="block text-xs text-muted">
            Requires a Client ID and Client Secret below.
          </span>
        </span>
      </label>

      <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-gold-strong">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]">Setup</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            In Google Cloud Console, open APIs &amp; Services → Credentials and
            create an OAuth client ID of type Web application.
          </li>
          <li>Add the origin and redirect URI below, then copy the client ID and secret here.</li>
          <li>On the OAuth consent screen, publish the app so any Google account can sign in.</li>
        </ol>
        <div className="mt-3 space-y-2">
          {(
            [
              ["Authorized JavaScript origin", origin],
              ["Authorized redirect URI", callbackUrl],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-white px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted">{label}</span>
                <code className="block break-all text-xs font-medium">{value}</code>
              </span>
              <button
                type="button"
                onClick={() => void copy(label, value)}
                className="shrink-0 rounded-md border border-gold/40 bg-gold/15 px-2.5 py-1 text-xs font-semibold transition hover:bg-gold/25"
              >
                {copied === label ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Client ID</span>
        <input
          value={form.clientId}
          onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
          placeholder="1234567890-abc.apps.googleusercontent.com"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Client Secret</span>
        <input
          type="password"
          autoComplete="off"
          value={form.clientSecret}
          onChange={(e) => setForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
          placeholder={hasStoredSecret ? "••••••••" : "GOCSPX-..."}
          className={INPUT_CLASS}
        />
        {hasStoredSecret && (
          <p className="text-xs text-muted">
            A client secret is already saved. Leave this blank to keep it.
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
          {saving ? "Saving..." : "Save Google Sign-In"}
        </button>
      </div>
    </div>
  );
}
