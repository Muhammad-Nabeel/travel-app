import Script from "next/script";

import { ContactClickTracker } from "@/components/analytics/contact-click-tracker";
import type { PublicAnalyticsConfig } from "@/lib/admin-settings/ga4-settings";

export function Ga4Loader({ config }: { config: PublicAnalyticsConfig }) {
  if (!config) {
    return null;
  }

  if (config.provider === "gtm") {
    return (
      <>
      <ContactClickTracker />
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
          })(window,document,'script','dataLayer','${config.id}');
        `}
      </Script>
      </>
    );
  }

  return (
    <>
      <ContactClickTracker />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${config.id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-base" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${config.id}', { send_page_view: true });
          (window.__ga4Queue || []).forEach(function (e) { gtag('event', e[0], e[1]); });
          window.__ga4Queue = [];
        `}
      </Script>
    </>
  );
}
