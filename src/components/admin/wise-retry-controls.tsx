"use client";

import { useState } from "react";

type WiseRetryControlsProps = {
  bookingId: string;
  disabled?: boolean;
};

type RetryResponse = {
  ok?: boolean;
  error?: string;
  retryCheckoutUrl?: string;
};

export function WiseRetryControls({
  bookingId,
  disabled = false,
}: WiseRetryControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCheckoutUrl, setRetryCheckoutUrl] = useState("");

  async function handleRetry() {
    setLoading(true);
    setError("");
    setRetryCheckoutUrl("");

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/wise-retry`, {
        method: "POST",
      });
      const json = (await res.json()) as RetryResponse;
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to request Wise retry.");
      }

      setRetryCheckoutUrl(json.retryCheckoutUrl ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to request Wise retry.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
        Wise Retry
      </p>
      <p className="mt-1 text-xs text-blue-900/80">
        Use this if checkout is stuck on pending. It logs a reconciliation
        retry event and generates a fresh Wise checkout URL.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleRetry()}
          disabled={disabled || loading}
          className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Preparing..." : "Retry Wise Checkout"}
        </button>
        {retryCheckoutUrl ? (
          <a
            href={retryCheckoutUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Open Checkout URL
          </a>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
