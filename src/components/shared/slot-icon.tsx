"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { useBrandAsset } from "@/components/shared/brand-provider";
import type { BrandAssetSlot } from "@/lib/brand-assets";

/**
 * Icon an admin can replace in Admin → Media → Brand & Icons. Renders the
 * uploaded image for `slot`, or `children` (the built-in icon) when none is set.
 */
export function SlotIcon({
  slot,
  size,
  className = "",
  children,
}: {
  slot: BrandAssetSlot;
  size: number;
  className?: string;
  children: ReactNode;
}) {
  const src = useBrandAsset(slot);
  if (!src) return children;

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
