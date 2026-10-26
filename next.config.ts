import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
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
  ...(cloudflareHost
    ? [
      {
        protocol: "https",
        hostname: cloudflareHost,
      },
    ]
    : []),
];

const nextConfig = {
  turbopack: {
    root: rootDirectory,
  },
  images: {
    remotePatterns,
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
