"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type HealthState = "checking" | "ok" | "error";

type Ga4HealthStatusProps = {
  compact?: boolean;
};

export function Ga4HealthStatus({ compact = false }: Ga4HealthStatusProps) {
  const [status, setStatus] = useState<HealthState>("checking");
  const [message, setMessage] = useState("Checking GA4 connection...");

  const checkGa4Health = useCallback(async (resetState = true) => {
    if (resetState) {
      setStatus("checking");
      setMessage("Checking GA4 connection...");
    }

    try {
      const settingsRes = await fetch("/api/admin/settings/ga4", {
        cache: "no-store",
      });
      const settingsJson = (await settingsRes.json()) as {
        provider?: "ga4" | "gtm";
        gtmContainerId?: string;
      };

      if (settingsJson.provider === "gtm") {
        if (settingsJson.gtmContainerId?.trim()) {
          setStatus("ok");
          setMessage("Google Tag Manager is active.");
        } else {
          setStatus("error");
          setMessage(
            "Google Tag Manager is selected but container ID is missing.",
          );
        }
        return;
      }

      const res = await fetch("/api/admin/settings/ga4?test=true", {
        cache: "no-store",
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };

      if (res.ok && json.ok) {
        setStatus("ok");
        setMessage(json.message ?? "GA4 connection is healthy.");
        return;
      }

      setStatus("error");
      setMessage(json.message ?? "GA4 connection check failed.");
    } catch {
      setStatus("error");
      setMessage("Unable to reach GA4 test endpoint.");
    }
  }, []);

  useEffect(() => {
    void checkGa4Health(false);
  }, [checkGa4Health]);

  const statusText =
    status === "ok"
      ? "Connected"
      : status === "checking"
        ? "Checking"
        : "Disconnected";
  const statusTextClass =
    status === "ok"
      ? "text-emerald-700"
      : status === "checking"
        ? "text-amber-700"
        : "text-rose-700";

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-2.5 py-1.5"
        title={message}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          GA4
        </span>
        <span className={`text-xs font-semibold ${statusTextClass}`}>
          {statusText}
        </span>
        <button
          type="button"
          onClick={() => void checkGa4Health(true)}
          className="rounded-md p-0.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Refresh GA4 health"
        >
          <RefreshCw
            className={`h-3 w-3 ${status === "checking" ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          GA4 Health
        </p>
        <button
          type="button"
          onClick={() => void checkGa4Health(true)}
          className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Refresh GA4 health"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <p className={`mt-1 text-xs font-semibold ${statusTextClass}`}>
        {statusText}
      </p>

      <p className="mt-1 text-[11px] leading-4 text-slate-500">{message}</p>
    </div>
  );
}
