import Image from "next/image";
import type { LucideIcon } from "lucide-react";

/**
 * Admin-uploaded brand icon (Admin → Media → Brand & Icons), or the built-in
 * Lucide icon when that slot has no upload. Works in server and client
 * components: pass the URL from `brand.assets[slot]`.
 */
export function BrandIcon({
  src,
  fallback: Fallback,
  size = 20,
  className = "",
}: {
  src: string | undefined;
  fallback: LucideIcon;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <Fallback
      aria-hidden
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
