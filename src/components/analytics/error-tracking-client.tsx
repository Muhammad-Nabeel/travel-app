"use client";

import { useEffect } from "react";

import type { PublicErrorTrackingConfig } from "@/lib/admin-settings/error-tracking-settings";
import { privacySafeDataCollection } from "@/lib/error-tracking/data-collection";

let started = false;

/**
 * Browser error tracking from Admin → Settings → Error Tracking. The Sentry
 * SDK is only downloaded when tracking is on, and only once the browser is
 * idle, so it never competes with the page's first paint.
 */
export function ErrorTrackingClient({ config }: { config: PublicErrorTrackingConfig | null }) {
  useEffect(() => {
    if (!config || started) return;
    started = true;

    const start = () => {
      void import("@sentry/nextjs").then((Sentry) => {
        Sentry.init({
          dsn: config.dsn,
          environment: config.environment,
          tracesSampleRate: config.tracesSampleRate,
          dataCollection: privacySafeDataCollection(),
          integrations:
            config.tracesSampleRate > 0 ? [Sentry.browserTracingIntegration()] : [],
        });
      });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(start, { timeout: 4000 });
    } else {
      setTimeout(start, 2000);
    }
  }, [config]);

  return null;
}
