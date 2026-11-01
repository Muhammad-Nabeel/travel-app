import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
// .env is not guaranteed to be loaded yet when this config is evaluated.
loadEnvConfig(rootDirectory);
const cloudflarePublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
const cloudflareHost = cloudflarePublicUrl ? new URL(cloudflarePublicUrl).hostname : null;

const remotePatterns = [
  {
    protocol: "https",
    hostname: "storage.googleapis.com",
  },
  {
    protocol: "https",
    hostname: "firebasestorage.googleapis.com",
  },
  {
    // Early uploads were saved with this unused domain; R2 is served from
    // storage.easytrip.com.pk (CLOUDFLARE_R2_PUBLIC_URL).
    protocol: "https",
    hostname: "media.easytrip.com.pk",
  },
  {
    // Stored image URLs use this host, so allow it even if the build env
    // points CLOUDFLARE_R2_PUBLIC_URL at the r2.dev address.
    protocol: "https",
    hostname: "storage.easytrip.com.pk",
  },
  ...(cloudflareHost
    ? [
      {
        protocol: "https",
        hostname: cloudflareHost,
      },
    ]
    : []),
  {
    // Placeholder photos in seed and mock data.
    protocol: "https",
    hostname: "images.unsplash.com",
  },
];

const nextConfig = {
  // Self-contained build in .next/standalone for cPanel/Passenger hosting
  // (see docs/DEPLOY_WEBHOSTMOST.md).
  output: "standalone",
  turbopack: {
    root: rootDirectory,
  },
  images: {
    remotePatterns,
    // Every image is served as WebP at the width the device needs.
    formats: ["image/webp"],
    qualities: [75],
    // Uploads get a new key per file, so optimized copies never go stale.
    minimumCacheTTL: 2678400,
  },
  async redirects() {
    return [
      // Old filtered blog URLs (/blog?category=umrah) move to indexable
      // category hubs. A config redirect returns a real 308, unlike
      // permanentRedirect() inside a streamed page.
      {
        source: "/blog",
        has: [{ type: "query", key: "category", value: "(?<category>[a-z-]+)" }],
        destination: "/blog/category/:category",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
