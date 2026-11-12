"use client";

import { useState } from "react";

import { useCaptcha } from "@/components/shared/captcha";

/** "Didn't get the email?" on the sign-in page: sends a fresh verification link. */
export function ResendVerification({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const captcha = useCaptcha();

  async function handleResend() {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter the email you signed up with.");
      return;
    }
    if (!captcha.ready) {
      setError("Please complete the security check.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), captchaToken: captcha.token }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Couldn't send the email. Please try again.");
      setMessage(json.message ?? "A new verification link is on its way.");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the email. Please try again.");
      setStatus("idle");
    } finally {
      captcha.reset();
    }
  }

  if (status === "sent") {
    return (
      <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {message}
      </p>
    );
  }

  return (
    <div className="mb-4 grid gap-2 rounded-xl border border-black/10 bg-white px-4 py-3">
      <p className="text-sm text-gray-700">Didn&apos;t get the verification email?</p>
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400"
      />
      {captcha.widget}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={status === "sending" || !captcha.ready}
        className="justify-self-start rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand transition hover:bg-brand-soft disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Resend verification email"}
      </button>
    </div>
  );
}
