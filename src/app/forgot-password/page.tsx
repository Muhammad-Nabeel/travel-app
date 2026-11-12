"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, PlaneTakeoff } from "lucide-react";
import { useBrand } from "@/components/shared/brand-provider";
import { useCaptcha } from "@/components/shared/captcha";

export default function ForgotPasswordPage() {
  const brand = useBrand();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const captcha = useCaptcha();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!captcha.ready) {
      setError("Please complete the security check.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          captchaToken: captcha.token,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
      } else {
        setSentMessage(json.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      captcha.reset();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-black transition hover:opacity-80"
          >
            {brand.assets.icon ? (
              <Image src={brand.assets.icon} alt="" width={44} height={44} className="size-11 object-contain" />
            ) : (
              <span className="rounded-full bg-brand p-2.5 text-white shadow-sm">
                <PlaneTakeoff className="size-5" />
              </span>
            )}
            <span className="display-font text-3xl leading-none">{brand.name}</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-black/8 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Forgot your password?
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {sentMessage ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
              {sentMessage} Check your inbox and spam folder.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-black/20 bg-white px-4 py-3 text-sm placeholder-gray-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="you@example.com"
                />
              </div>

              {captcha.widget}

              <button
                type="submit"
                disabled={loading || !captcha.ready}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Remembered it?{" "}
            <Link
              href="/signin"
              className="font-medium text-sky-400 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
