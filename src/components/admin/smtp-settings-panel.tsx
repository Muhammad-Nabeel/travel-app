"use client";

import { useEffect, useState } from "react";

import type { SmtpSettings } from "@/lib/admin-settings/smtp-settings";

const ENDPOINT = "/api/admin/settings/smtp";

/** Suggested values for a first-time setup; the admin can change any of them. */
const SUGGESTED_FORM: SmtpSettings = {
  host: "",
  port: 587,
  secure: false,
  username: "",
  password: "",
  fromName: "",
  fromEmail: "",
};

const ENCRYPTION_PRESETS = [
  { label: "STARTTLS (587)", secure: false, port: 587 },
  { label: "SSL/TLS (465)", secure: true, port: 465 },
] as const;

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

/** Outgoing email server used for account verification and contact form emails, stored encrypted. */
export function SmtpSettingsPanel() {
  const [form, setForm] = useState<SmtpSettings>(SUGGESTED_FORM);
  const [hasStoredPassword, setHasStoredPassword] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(ENDPOINT, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as Omit<SmtpSettings, "password"> & {
          hasPassword?: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Unable to load SMTP settings.");
        return json;
      })
      .then((loaded) => {
        if (ignore) return;
        setHasStoredPassword(Boolean(loaded.hasPassword));
        // Nothing saved yet: keep the suggested values.
        if (!loaded.host && !loaded.hasPassword) return;
        setForm({
          host: loaded.host,
          port: loaded.port,
          secure: loaded.secure,
          username: loaded.username,
          password: "",
          fromName: loaded.fromName,
          fromEmail: loaded.fromEmail,
        });
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Unable to load SMTP settings.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  function updateUsername(username: string) {
    setForm((prev) => ({
      ...prev,
      username,
      // Mailbox logins are usually the sending address, so suggest it.
      fromEmail: prev.fromEmail && prev.fromEmail !== prev.username ? prev.fromEmail : username,
    }));
  }

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
      if (!res.ok) throw new Error(json.error ?? "Failed to save SMTP settings.");

      if (form.password) setHasStoredPassword(true);
      setForm((prev) => ({ ...prev, password: "" }));
      setMessage("Saved. Website emails will be sent through this server.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SMTP settings.");
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
        body: JSON.stringify({ ...form, testRecipient }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) throw new Error(json.message ?? "SMTP connection test failed.");
      setMessage(json.message ?? "Connected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "SMTP connection test failed.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading SMTP settings...</p>;
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Email</p>
        <h2 className="mt-2 text-xl font-semibold text-navy">SMTP Server</h2>
        <p className="mt-1 text-sm text-muted">
          Verification emails for new accounts and Contact Us messages are sent through this server.
          Until it is saved, sign-up cannot send verification emails.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">SMTP Host</span>
          <input
            value={form.host}
            onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))}
            placeholder="mail.example.com"
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Port</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.port || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, port: Number(e.target.value) || 0 }))}
            placeholder="587"
            className={INPUT_CLASS}
          />
          <span className="flex flex-wrap gap-2">
            {ENCRYPTION_PRESETS.map((preset) => (
              <button
                key={preset.port}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, secure: preset.secure, port: preset.port }))}
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                  form.secure === preset.secure
                    ? "border-brand bg-brand-soft text-brand-strong"
                    : "border-line bg-white text-navy/80 hover:bg-subtle"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Username</span>
          <input
            value={form.username}
            onChange={(e) => updateUsername(e.target.value)}
            placeholder="noreply@example.com"
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={hasStoredPassword ? "Saved. Leave blank to keep it." : "Mailbox password"}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">From Name</span>
          <input
            value={form.fromName}
            onChange={(e) => setForm((prev) => ({ ...prev, fromName: e.target.value }))}
            placeholder="Your brand name"
            className={INPUT_CLASS}
          />
          <span className="text-xs text-muted">Shown as the sender in the inbox.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">From Email</span>
          <input
            type="email"
            value={form.fromEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, fromEmail: e.target.value }))}
            placeholder="noreply@example.com"
            className={INPUT_CLASS}
          />
          <span className="text-xs text-muted">Most servers require this to match the username.</span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 rounded-xl border border-line bg-subtle px-4 py-3">
        <span className="text-xs font-semibold text-muted">Send test email to (optional)</span>
        <input
          type="email"
          value={testRecipient}
          onChange={(e) => setTestRecipient(e.target.value)}
          placeholder="you@example.com"
          className={INPUT_CLASS}
        />
        <span className="text-xs text-muted">Leave blank to only check that the server accepts the login.</span>
      </label>

      {message && <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">{message}</p>}
      {error && <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={busy !== null}
          className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-subtle disabled:opacity-70"
        >
          {busy === "test" ? "Testing..." : "Test Connection"}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy !== null}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
        >
          {busy === "save" ? "Saving..." : "Save SMTP Settings"}
        </button>
      </div>
    </div>
  );
}
