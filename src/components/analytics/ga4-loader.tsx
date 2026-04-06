"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type Ga4SettingsResponse = {
  provider?: "ga4" | "gtm";
  gtmContainerId?: string;
  measurementId?: string;
};

type AnalyticsConfig = {
  provider: "ga4" | "gtm";
  measurementId: string;
  gtmContainerId: string;
};

export function Ga4Loader() {
  const [config, setConfig] = useState<AnalyticsConfig>({
    provider: "ga4",
    measurementId: "",
    gtmContainerId: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAnalyticsConfig() {
      const envProvider =
        process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER?.trim().toLowerCase() ?? "";
      const envGtmContainerId =
        process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() ?? "";
      const envMeasurementId =
        process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";

      if (envProvider === "gtm" && envGtmContainerId) {
        if (isMounted) {
          setConfig({
            provider: "gtm",
            gtmContainerId: envGtmContainerId,
            measurementId: "",
          });
        }
        return;
      }

      if (envMeasurementId) {
        if (isMounted) {
          setConfig({
            provider: "ga4",
            measurementId: envMeasurementId,
            gtmContainerId: "",
          });
        }
        return;
      }

      try {
        const res = await fetch("/api/admin/settings/ga4", {
          cache: "no-store",
        });
        if (!res.ok) return;

        const json = (await res.json()) as Ga4SettingsResponse;
        const provider = json.provider === "gtm" ? "gtm" : "ga4";
        const gtmContainerId = json.gtmContainerId?.trim() ?? "";
        const measurementId = json.measurementId?.trim() ?? "";
        if (isMounted) {
          setConfig({
            provider,
            gtmContainerId,
            measurementId,
          });
        }
      } catch {
        // Keep the app resilient if analytics config cannot be fetched.
      }
    }

    void loadAnalyticsConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  if (config.provider === "gtm" && config.gtmContainerId) {
    return (
      <>
        <Script id="gtm-base" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),
                  dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${config.gtmContainerId}');
          `}
        </Script>
      </>
    );
  }

  if (!config.measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-base" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${config.measurementId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
