"use client";

import Image from "next/image";

import { useBrandAsset } from "@/components/shared/brand-provider";

/** Illustration above an empty-results message; renders nothing until one is uploaded. */
export function EmptyStateImage({ slot }: { slot: "emptyFlights" | "emptyPackages" }) {
  const url = useBrandAsset(slot);
  if (!url) return null;

  return (
    <Image src={url} alt="" width={128} height={128} className="mx-auto mb-4 h-32 w-auto object-contain" />
  );
}
