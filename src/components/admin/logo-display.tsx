"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface LogoDisplayProps {
  fileName: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function LogoDisplay({
  fileName,
  alt = "Logo",
  width = 128,
  height = 128,
  className = "",
}: LogoDisplayProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogo() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/logos?fileName=${encodeURIComponent(fileName)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch logo");
        }

        const data = await response.json();
        setLogoUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load logo");
      } finally {
        setLoading(false);
      }
    }

    fetchLogo();
  }, [fileName]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-line/50 ${className}`}
        style={{ width, height }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted/70" />
      </div>
    );
  }

  if (error || !logoUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-line/50 text-xs text-muted ${className}`}
        style={{ width, height }}
      >
        {error || "Logo not found"}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image
        src={logoUrl}
        alt={alt}
        width={width}
        height={height}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}
