"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Loader2, PlaneTakeoff } from "lucide-react";
import { useBrand } from "@/components/shared/brand-provider";

function ResetPasswordForm() {
  const brand = useBrand();
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/signin?reset=success");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-black/20 bg-white px-4 py-3 pr-10 text-sm placeholder-gray-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

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
            Choose a new password
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Use at least 8 characters.
          </p>

          {!token ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              This reset link is invalid. Please{" "}
              <Link href="/forgot-password" className="font-medium underline">
                request a new one
              </Link>
              .
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Update password
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
