"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ImageIcon, ImageUp, Loader2, Search, X } from "lucide-react";

/** Media library folders, matching the prefixes used by /api/admin/media. */
export type MediaFolder =
  | "website-logo"
  | "brand-assets"
  | "blog-media"
  | "umrah-images"
  | "destination-images"
  | "activities-images"
  | "general";

const FOLDERS: { value: MediaFolder; label: string }[] = [
  { value: "blog-media", label: "Blog" },
  { value: "destination-images", label: "Destinations" },
  { value: "activities-images", label: "Activities" },
  { value: "umrah-images", label: "Umrah" },
  { value: "brand-assets", label: "Brand & Icons" },
  { value: "website-logo", label: "Logos" },
  { value: "general", label: "General" },
];

const IMAGE_EXTENSION = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

type MediaFile = {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  mediaType: MediaFolder;
};

function fileName(key: string) {
  return key.split("/").pop() || key;
}

type MediaPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  /** Folder shown first and used for new uploads. */
  folder?: MediaFolder;
  title?: string;
};

/**
 * Gallery of images already in the R2 media library. Admins filter by folder
 * or name and click an image to use it, or upload a new one into the folder.
 */
export function MediaPickerDialog({
  open,
  onClose,
  onSelect,
  folder = "general",
  title = "Choose an image",
}: MediaPickerDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [activeFolder, setActiveFolder] = useState<MediaFolder | "all">(folder);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadFiles = useCallback(async (target: MediaFolder | "all") => {
    setLoading(true);
    setError("");
    try {
      const params = target === "all" ? "" : `?mediaType=${target}`;
      const res = await fetch(`/api/admin/media${params}`, { cache: "no-store" });
      const json = (await res.json()) as { files?: MediaFile[]; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Unable to load media.");
      }
      setFiles(json.files ?? []);
    } catch (err) {
      setFiles([]);
      setError(err instanceof Error ? err.message : "Unable to load media.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Start from the caller's folder each time the dialog opens.
  useEffect(() => {
    if (open) {
      setActiveFolder(folder);
      setQuery("");
    }
  }, [open, folder]);

  useEffect(() => {
    if (open) void loadFiles(activeFolder);
  }, [open, activeFolder, loadFiles]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const images = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return files
      .filter((file) => IMAGE_EXTENSION.test(file.key))
      .filter((file) => !needle || file.key.toLowerCase().includes(needle))
      .sort(
        (a, b) =>
          new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
      );
  }, [files, query]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaType", activeFolder === "all" ? folder : activeFolder);
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Upload failed.");
      }
      onSelect(json.url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  const uploadFolderLabel =
    FOLDERS.find((f) => f.value === (activeFolder === "all" ? folder : activeFolder))
      ?.label ?? "General";

  // Portal keeps the dialog out of the caller's <form>, so Enter in the
  // search box never submits it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3">
          <div className="flex flex-wrap gap-1.5">
            {[{ value: "all" as const, label: "All" }, ...FOLDERS].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveFolder(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeFolder === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by file name"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageUp className="size-4" />
              )}
              Upload to {uploadFolderLabel}
            </button>
          </div>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-slate-400" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-slate-500">
              <ImageIcon className="size-8 text-slate-300" />
              {query ? "No images match your search." : "No images in this folder yet."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image) => (
                <button
                  key={image.key}
                  type="button"
                  onClick={() => {
                    onSelect(image.url);
                    onClose();
                  }}
                  title={fileName(image.key)}
                  className="group overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-blue-500 hover:ring-2 hover:ring-blue-200"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element -- image is hosted on R2 */}
                    <img
                      src={image.url}
                      alt={fileName(image.key)}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="truncate px-2 py-1.5 text-xs text-slate-600 group-hover:text-blue-700">
                    {fileName(image.key)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

type MediaUrlInputProps = {
  value: string;
  onChange: (url: string) => void;
  folder?: MediaFolder;
  placeholder?: string;
  required?: boolean;
  type?: "url" | "text";
  maxLength?: number;
  inputClassName?: string;
};

/**
 * Image URL field with a "Choose from library" gallery. A URL can still be
 * typed or pasted for images hosted elsewhere.
 */
export function MediaUrlInput({
  value,
  onChange,
  folder,
  placeholder,
  required,
  type = "text",
  maxLength,
  inputClassName = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500",
}: MediaUrlInputProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={type}
          maxLength={maxLength}
          className={`min-w-0 flex-1 ${inputClassName}`}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700"
        >
          <ImageIcon className="size-4" />
          Choose from library
        </button>
      </div>
      {value ? (
        <div className="relative h-24 w-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary URL */}
          <img src={value} alt="Selected image preview" className="h-full w-full object-cover" />
          <span className="absolute right-1 top-1 rounded-full bg-emerald-500 p-0.5 text-white">
            <Check className="size-3" />
          </span>
        </div>
      ) : null}
      <MediaPickerDialog open={open} onClose={close} onSelect={onChange} folder={folder} />
    </div>
  );
}
