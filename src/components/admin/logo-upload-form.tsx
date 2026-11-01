"use client";

import { useState, useRef } from "react";
import { useLogoManager } from "@/lib/hooks/use-logo-manager";
import { Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";

export function LogoUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadLogo, isLoading, error, clearError } = useLogoManager();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    clearError();
    setSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadLogo(file);
    if (result) {
      setLogoUrl(result.url);
      setFileName(result.fileName);
      setSuccess(true);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-line bg-white p-6">
      <h2 className="mb-4 text-xl font-semibold text-navy">Upload Logo</h2>

      {/* File Input */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isLoading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full rounded-lg border-2 border-dashed border-line-strong px-4 py-8 text-center transition hover:border-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="mx-auto mb-2 h-6 w-6 text-muted/70" />
          <p className="text-sm font-medium text-navy/80">
            Click to upload logo
          </p>
          <p className="text-xs text-muted">PNG, JPG up to 5MB</p>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-4 py-3 text-sm text-brand-strong">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading logo...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-deal/6 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-deal" />
          <p className="text-sm text-deal">{error}</p>
        </div>
      )}

      {/* Success State */}
      {success && logoUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-success/8 px-4 py-3 text-sm text-success">
            <CheckCircle className="h-4 w-4" />
            Logo uploaded successfully!
          </div>

          {/* Logo Preview */}
          <div className="rounded-lg border border-line bg-subtle p-4">
            <p className="mb-3 text-sm font-medium text-navy/80">Preview:</p>
            <div className="relative h-32 w-32 overflow-hidden rounded-lg">
              <Image
                src={logoUrl}
                alt="Uploaded logo"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* CDN URL */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-navy/80">CDN URL:</p>
            <div className="rounded-lg border border-line bg-subtle p-3">
              <code className="break-all text-xs text-muted">
                {logoUrl}
              </code>
            </div>
            <p className="text-xs text-muted">File: {fileName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
