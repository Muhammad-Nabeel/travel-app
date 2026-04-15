"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Eye,
  Download,
  Settings,
  Star,
  Copy,
  Menu,
  X,
} from "lucide-react";

type MediaFile = {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  mediaType:
    | "website-logo"
    | "blog-media"
    | "umrah-images"
    | "destination-images"
    | "activities-images"
    | "general";
};

type MediaType =
  | "website-logo"
  | "blog-media"
  | "umrah-images"
  | "destination-images"
  | "activities-images"
  | "general";

type MediaSection =
  | "logo-settings"
  | "blog-images"
  | "umrah-images"
  | "destination-images"
  | "activities-images";

type MediaSettings = {
  websiteLogo: string | null;
};

const MEDIA_SECTIONS: Record<MediaSection, { label: string; type: MediaType }> =
  {
    "logo-settings": {
      label: "Logo Settings",
      type: "website-logo",
    },
    "blog-images": {
      label: "Blog Images",
      type: "blog-media",
    },
    "umrah-images": {
      label: "Umrah Images",
      type: "umrah-images",
    },
    "destination-images": {
      label: "Destination Images",
      type: "destination-images",
    },
    "activities-images": {
      label: "Activities Images",
      type: "activities-images",
    },
  };

export default function AdminMediaPage() {
  const [activeSection, setActiveSection] =
    useState<MediaSection>("logo-settings");
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<MediaSettings>({
    websiteLogo: null,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadMedia(section: MediaSection = "logo-settings") {
    setLoading(true);
    setError("");

    try {
      const mediaType = MEDIA_SECTIONS[section].type;
      const params = mediaType ? `?mediaType=${mediaType}` : "";
      const res = await fetch(`/api/admin/media${params}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Unable to load media.");
      }

      setFiles(json.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load media.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);

    try {
      const res = await fetch("/api/admin/settings/media");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Unable to load settings.");
      }

      setSettings(
        json.settings || {
          websiteLogo: null,
        },
      );
    } catch (err) {
      console.error("Failed to load media settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  }

  useEffect(() => {
    loadMedia(activeSection);
    loadSettings();
  }, [activeSection]);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaType", MEDIA_SECTIONS[activeSection].type);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Upload failed.");
      }

      setMessage("File uploaded successfully.");
      await loadMedia(activeSection);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(fileKey: string) {
    setDeletingKey(fileKey);
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `/api/admin/media?fileKey=${encodeURIComponent(fileKey)}`,
        {
          method: "DELETE",
        },
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Delete failed.");
      }

      setMessage("File deleted successfully.");
      await loadMedia(activeSection);

      const urlToRemove = files.find((f) => f.key === fileKey)?.url;
      if (urlToRemove && settings.websiteLogo === urlToRemove) {
        await updateSettings({ websiteLogo: null });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingKey(null);
    }
  }

  async function updateSettings(updates: Partial<MediaSettings>) {
    setSavingSettings(true);

    try {
      const res = await fetch("/api/admin/settings/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, ...updates }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Settings save failed.");
      }

      setSettings(json.settings);
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settings save failed.");
    } finally {
      setSavingSettings(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getFileNameFromKey(key: string): string {
    return key.split("/").pop() || key;
  }

  function getSectionDescription(section: MediaSection) {
    switch (section) {
      case "logo-settings":
        return "Upload and select the website header logo. The selected logo is saved in the database and used on the public site header.";
      case "blog-images":
        return "Upload blog images and build a reusable media library for blog posts.";
      case "umrah-images":
        return "Add Umrah package images so your package pages can reference them directly from the media library.";
      case "destination-images":
        return "Upload destination images for location pages and promotional sections.";
      case "activities-images":
        return "Upload activities images for excursions, tours, and experience listings.";
      default:
        return "Upload media files for the selected library section.";
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("URL copied to clipboard!");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setMessage("URL copied to clipboard!");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  const filteredFiles = files;
  const sectionLabel = MEDIA_SECTIONS[activeSection].label;
  const sectionDescription = getSectionDescription(activeSection);
  const uploadTitle =
    activeSection === "logo-settings"
      ? "Upload Website Logo"
      : `Upload ${sectionLabel}`;
  const layoutClass = menuOpen ? "lg:grid-cols-[18rem_1fr]" : "lg:grid-cols-1";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className={`grid gap-6 ${layoutClass}`}>
        <aside
          className={`rounded-3xl border border-blue-100 bg-white p-6 shadow-sm ${menuOpen ? "block" : "hidden"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Media Library
            </p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {(Object.keys(MEDIA_SECTIONS) as MediaSection[]).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  activeSection === section
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {MEDIA_SECTIONS[section].label}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 w-full justify-center"
            >
              <Menu className="h-4 w-4" />
              {menuOpen ? "Hide menu" : "Show menu"}
            </button>
          </div>
        </aside>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
                <Settings className="h-4 w-4" />
                <span>{sectionLabel}</span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-950">
                {sectionLabel}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {sectionDescription}
              </p>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
              <Settings className="h-4 w-4" />
              <span>{sectionLabel}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950">
              {sectionLabel}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {sectionDescription}
            </p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              {error}
            </div>
          )}

          {activeSection === "logo-settings" && (
            <div className="mb-8 bg-slate-50 rounded-3xl border border-slate-200 p-6">
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Selected Header Logo
                    </label>
                    {settings.websiteLogo ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={settings.websiteLogo}
                            alt="Website Logo"
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              Active header logo
                            </p>
                            <p className="text-xs text-slate-500 break-all">
                              {settings.websiteLogo}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(settings.websiteLogo!)
                            }
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            Copy URL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateSettings({ websiteLogo: null })
                            }
                            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Clear logo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No logo selected yet. Upload and choose one from the
                        list below.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-8 border-2 border-dashed border-slate-300 rounded-3xl p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="block text-sm font-medium text-slate-900">
                    {uploadTitle}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    PNG, JPG, GIF, WebP up to 50MB
                  </span>
                </label>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  <span className="text-sm text-slate-600">Uploading...</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <Upload className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">
                  No {sectionLabel.toLowerCase()} uploaded
                </h3>
                <p className="text-sm text-slate-500">
                  Get started by uploading your first{" "}
                  {sectionLabel.toLowerCase()}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => {
                  const isSelectedWebsiteLogo =
                    activeSection === "logo-settings" &&
                    settings.websiteLogo === file.url;

                  return (
                    <div
                      key={file.key}
                      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 overflow-hidden flex-shrink-0">
                          {file.url.includes("image") ? (
                            <Image
                              src={file.url}
                              alt={getFileNameFromKey(file.key)}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-2xl text-slate-400">📄</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 max-w-[120px] truncate">
                              {getFileNameFromKey(file.key)}
                            </p>
                            {isSelectedWebsiteLogo && (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700 flex-shrink-0">
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 w-full sm:w-auto sm:grid-cols-2 lg:grid-cols-3">
                        {activeSection === "logo-settings" ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateSettings({ websiteLogo: file.url })
                            }
                            disabled={savingSettings}
                            className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                              isSelectedWebsiteLogo
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {isSelectedWebsiteLogo ? "Selected" : "Set as Logo"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(file.url)}
                          className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Copy URL
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(file.url, "_blank")}
                          className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = file.url;
                            link.download = getFileNameFromKey(file.key);
                            link.click();
                          }}
                          className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(file.key)}
                          disabled={deletingKey === file.key}
                          className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-70"
                        >
                          {deletingKey === file.key ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
