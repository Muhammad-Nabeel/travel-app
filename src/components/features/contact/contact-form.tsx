"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

type ContactFormProps = {
  labels: {
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailFieldLabel: string;
    emailFieldPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitLabel: string;
  };
  supportEmail: string;
};

const INPUT_CLASS =
  "rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white";

export function ContactForm({ labels, supportEmail }: ContactFormProps) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim() || !form.message.trim()) {
      setError("Please enter your name and a message.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Unable to send your message.");
      }

      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(
        `${err instanceof Error ? err.message : "Unable to send your message."} You can also email us at ${supportEmail}.`,
      );
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl bg-emerald-50 p-6 text-emerald-800">
        <CheckCircle className="h-6 w-6" />
        <p className="text-lg font-semibold">Thank you, your message is sent.</p>
        <p className="text-sm">Our team will reply to your email shortly.</p>
      </div>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium text-slate-900">
            {labels.fullNameLabel}
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={labels.fullNamePlaceholder}
            className={`h-14 ${INPUT_CLASS}`}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-base font-medium text-slate-900">
            {labels.emailFieldLabel}
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder={labels.emailFieldPlaceholder}
            className={`h-14 ${INPUT_CLASS}`}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-base font-medium text-slate-900">
          {labels.messageLabel}
        </span>
        <textarea
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          placeholder={labels.messagePlaceholder}
          className={`min-h-40 py-4 ${INPUT_CLASS}`}
          required
        />
      </label>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
      >
        {status === "submitting" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {labels.submitLabel}
      </button>
    </form>
  );
}
