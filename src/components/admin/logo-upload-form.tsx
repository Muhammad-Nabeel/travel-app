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
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Upload Logo</h2>

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
          className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-center transition hover:border-sky-400 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">
            Click to upload logo
          </p>
          <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading logo...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success State */}
      {success && logoUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            Logo uploaded successfully!
          </div>

          {/* Logo Preview */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">Preview:</p>
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
            <p className="text-sm font-medium text-slate-700">CDN URL:</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <code className="break-all text-xs text-slate-600">
                {logoUrl}
              </code>
            </div>
            <p className="text-xs text-slate-500">File: {fileName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
