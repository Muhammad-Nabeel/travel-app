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
};

export default nextConfig;
