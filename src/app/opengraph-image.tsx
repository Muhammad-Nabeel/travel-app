import { ImageResponse } from "next/og";

import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";

// Re-render with the brand name set in the admin dashboard.
export const revalidate = 300;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const { name } = await getStoredBrandSettings();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        background:
          "linear-gradient(135deg, #082f49 0%, #0f766e 48%, #f59e0b 100%)",
        color: "white",
        padding: "72px",
        fontFamily: "sans-serif",
        justifyContent: "space-between",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: 0.92,
        }}
      >
        {name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800 }}>
          Flights, Umrah, and
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800 }}>
          better travel planning.
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 920,
            fontSize: 30,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.86)",
          }}
        >
          Search routes, compare destinations, browse activities, and publish
          travel content with stronger SEO foundations.
        </div>
      </div>
    </div>,
    size,
  );
}
