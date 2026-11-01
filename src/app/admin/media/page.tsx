"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  ChevronDown,
  Compass,
  Copy,
  Download,
  ExternalLink,
  ImageUp,
  LayoutPanelTop,
  PanelBottom,
  Loader2,
  MapPin,
  MoonStar,
  Newspaper,
  Palette,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { BrandAssetsPanel } from "@/components/admin/brand-assets-panel";
import { FooterMediaPanel } from "@/components/admin/footer-media-panel";
import { PageBannersPanel } from "@/components/admin/page-banners-panel";

type MediaType =
  | "website-logo"
  | "brand-assets"
  | "footer-media"
  | "page-banners"
  | "blog-media"
  | "umrah-images"
  | "destination-images"
  | "activities-images"
  | "tour-images"
  | "general";

type MediaFile = {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  mediaType: MediaType;
};

type MediaSection =
  | "logo-settings"
  | "brand-assets"
  | "footer"
  | "page-banners"
  | "blog-images"
  | "umrah-images"
  | "destination-images"
  | "activities-images"
  | "tour-images";

const MEDIA_SECTIONS: Record<
  MediaSection,
  { label: string; type: MediaType; icon: LucideIcon; description: string }
> = {
  "logo-settings": {
    label: "Logo",
    type: "website-logo",
    icon: BadgeCheck,
    description: "Upload logos and choose the one shown in the site header.",
  },
  "brand-assets": {
    label: "Brand & Icons",
    type: "brand-assets",
    icon: Palette,
    description:
      "Favicon, service icons and empty-state images. Empty slots keep the built-in icons.",
  },
  footer: {
    label: "Footer",
    type: "footer-media",
    icon: PanelBottom,
    description:
      "Contact and help-link icons, plus the payment and accreditation badges.",
  },
  "page-banners": {
    label: "Page Banners",
    type: "page-banners",
    icon: LayoutPanelTop,
    description:
      "Hero banner for the home, flights, Umrah, tours, hotels, visa and things-to-do pages.",
  },
  "blog-images": {
    label: "Blog Images",
    type: "blog-media",
    icon: Newspaper,
    description: "Cover and inline images for blog posts.",
  },
  "umrah-images": {
    label: "Umrah Images",
    type: "umrah-images",
    icon: MoonStar,
    description: "Images for Umrah package pages.",
  },
  "destination-images": {
    label: "Destination Images",
    type: "destination-images",
    icon: MapPin,
    description: "Images for destination pages and promotional sections.",
  },
  "activities-images": {
    label: "Activities Images",
    type: "activities-images",
    icon: Compass,
    description: "Images for excursions, tours and experiences.",
  },
  "tour-images": {
    label: "Tour Package Images",
    type: "tour-images",
    icon: Briefcase,
    description: "Card and gallery images for tour package pages.",
  },
};

const SECTIONS = Object.keys(MEDIA_SECTIONS) as MediaSection[];
const IMAGE_EXTENSION = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileNameFromKey(key: string): string {
  return key.split("/").pop() || key;
}

export default function AdminMediaPage() {
  const [openSection, setOpenSection] = useState<MediaSection | null>(
    "logo-settings",
  );
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [websiteLogo, setWebsiteLogo] = useState<string | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Every folder is loaded at once so each accordion row can show its count.
  async function loadMedia() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" });
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

  async function loadLogo() {
    try {
      // The header logo is the brand logo (Admin → Settings → Brand).
      const res = await fetch("/api/admin/settings/brand");
      const json = (await res.json()) as { logoUrl?: string | null };
      if (res.ok) setWebsiteLogo(json.logoUrl ?? null);
    } catch (err) {
      console.error("Failed to load the header logo:", err);
    }
  }

  useEffect(() => {
    void loadMedia();
    void loadLogo();
  }, []);

  const filesBySection = useMemo(() => {
    const grouped = Object.fromEntries(
      SECTIONS.map((section) => [section, [] as MediaFile[]]),
    ) as Record<MediaSection, MediaFile[]>;

    for (const file of files) {
      const section = SECTIONS.find(
        (s) => MEDIA_SECTIONS[s].type === file.mediaType,
      );
      if (section) grouped[section].push(file);
    }
    for (const section of SECTIONS) {
      grouped[section].sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime(),
      );
    }
    return grouped;
  }, [files]);

  function flash(text: string) {
    setError("");
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  }

  async function uploadFiles(section: MediaSection, selected: File[]) {
    if (selected.length === 0) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mediaType", MEDIA_SECTIONS[section].type);

        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? `Upload of ${file.name} failed.`);
        }
      }

      flash(
        selected.length === 1
          ? "File uploaded."
          : `${selected.length} files uploaded.`,
      );
      await loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(file: MediaFile) {
    if (
      !window.confirm(
        `Delete ${getFileNameFromKey(file.key)}? Pages using this image will show a broken image.`,
      )
    ) {
      return;
    }

    setDeletingKey(file.key);
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `/api/admin/media?fileKey=${encodeURIComponent(file.key)}`,
        { method: "DELETE" },
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Delete failed.");
      }

      if (websiteLogo === file.url) {
        await updateLogo(null);
      }
      flash("File deleted.");
      await loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingKey(null);
    }
  }

  async function updateLogo(logoUrl: string | null) {
    setSavingLogo(true);

    try {
      const res = logoUrl
        ? await fetch("/api/admin/settings/brand", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logoUrl }),
          })
        : await fetch("/api/admin/settings/brand", { method: "DELETE" });
      const json = (await res.json()) as {
        logoUrl?: string | null;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? "Could not save the logo.");
      }

      setWebsiteLogo(json.logoUrl ?? null);
      flash(logoUrl ? "Header logo updated." : "Header logo cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the logo.");
    } finally {
      setSavingLogo(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    flash("URL copied to clipboard.");
  }

  function downloadFile(file: MediaFile) {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = getFileNameFromKey(file.key);
    link.click();
  }

  function renderSectionBody(section: MediaSection) {
    if (section === "brand-assets") {
      return <BrandAssetsPanel />;
    }
    if (section === "footer") {
      return <FooterMediaPanel />;
    }
    if (section === "page-banners") {
      return <PageBannersPanel />;
    }

    const sectionFiles = filesBySection[section];
    const isLogo = section === "logo-settings";

    return (
      <div className="space-y-5">
        {isLogo ? (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-subtle p-4">
            <div className="flex h-14 w-28 items-center justify-center rounded-xl border border-line bg-white p-2">
              {websiteLogo ? (
                // eslint-disable-next-line @next/next/no-img-element -- logo is hosted on R2
                <img
                  src={websiteLogo}
                  alt="Current header logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-muted/70">None</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">
                Current header logo
              </p>
              <p className="text-xs text-muted">
                {websiteLogo
                  ? "Pick another logo below to replace it."
                  : "No logo selected. The brand name is shown instead."}
              </p>
            </div>
            {websiteLogo ? (
              <button
                type="button"
                onClick={() => updateLogo(null)}
                disabled={savingLogo}
                className="rounded-xl border border-deal/20 bg-white px-3 py-2 text-xs font-semibold text-deal hover:bg-deal/6 disabled:opacity-60"
              >
                Clear logo
              </button>
            ) : null}
          </div>
        ) : null}

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void uploadFiles(section, Array.from(event.dataTransfer.files));
          }}
          className={`flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-dashed px-5 py-4 text-center transition sm:flex-row sm:text-left ${
            dragging ? "border-brand bg-brand-soft" : "border-line bg-subtle/60"
          }`}
        >
          <div>
            <p className="text-sm font-semibold text-navy">
              Drop images here or upload from your computer
            </p>
            <p className="text-xs text-muted">
              PNG, JPG, GIF or WebP, up to 50 MB each
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              uploadFiles(section, Array.from(event.target.files ?? []))
            }
            disabled={uploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageUp className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-muted/70" />
          </div>
        ) : sectionFiles.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Nothing here yet. Uploaded images will appear in this gallery.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sectionFiles.map((file) => {
              const isCurrentLogo = isLogo && websiteLogo === file.url;
              const name = getFileNameFromKey(file.key);

              return (
                <div
                  key={file.key}
                  className={`group overflow-hidden rounded-2xl border bg-white transition hover:shadow-md ${
                    isCurrentLogo
                      ? "border-brand ring-2 ring-brand/15"
                      : "border-line"
                  }`}
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center bg-subtle">
                    {IMAGE_EXTENSION.test(file.key) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- image is hosted on R2
                      <img
                        src={file.url}
                        alt={name}
                        loading="lazy"
                        className={`max-h-full max-w-full ${isLogo ? "object-contain p-3" : "h-full w-full object-cover"}`}
                      />
                    ) : (
                      <span className="text-xs font-medium uppercase text-muted/70">
                        {name.split(".").pop()}
                      </span>
                    )}

                    {isCurrentLogo ? (
                      <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                        In use
                      </span>
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-navy/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      {[
                        {
                          label: "Copy URL",
                          icon: Copy,
                          onClick: () => copyToClipboard(file.url),
                        },
                        {
                          label: "Open",
                          icon: ExternalLink,
                          onClick: () => window.open(file.url, "_blank"),
                        },
                        {
                          label: "Download",
                          icon: Download,
                          onClick: () => downloadFile(file),
                        },
                      ].map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={action.onClick}
                          title={action.label}
                          aria-label={`${action.label}: ${name}`}
                          className="rounded-lg bg-white/90 p-1.5 text-navy/80 hover:bg-white"
                        >
                          <action.icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        disabled={deletingKey === file.key}
                        title="Delete"
                        aria-label={`Delete ${name}`}
                        className="rounded-lg bg-white/90 p-1.5 text-deal hover:bg-white disabled:opacity-60"
                      >
                        {deletingKey === file.key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p
                        className="truncate text-xs font-medium text-navy/80"
                        title={name}
                      >
                        {name}
                      </p>
                      <p className="text-[11px] text-muted/70">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    {isLogo && !isCurrentLogo ? (
                      <button
                        type="button"
                        onClick={() => updateLogo(file.url)}
                        disabled={savingLogo}
                        className="shrink-0 rounded-lg bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand-strong hover:bg-brand-soft disabled:opacity-60"
                      >
                        Use
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-navy">Media Library</h1>
        <p className="mt-1 text-sm text-muted">
          Images stored on Cloudflare R2. Anything uploaded here can be picked
          from the &ldquo;Choose from library&rdquo; button on admin forms.
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-success/25 bg-success/8 px-4 py-3 text-sm text-success">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-deal/20 bg-deal/6 px-4 py-3 text-sm text-deal">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const { label, description, icon: Icon } = MEDIA_SECTIONS[section];
          const isOpen = openSection === section;
          const count = filesBySection[section].length;

          return (
            <div
              key={section}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                isOpen ? "border-line" : "border-line"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : section)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-subtle"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isOpen ? "bg-brand text-white" : "bg-brand-soft text-brand"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-navy">
                    {label}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {description}
                  </span>
                </span>
                {section !== "brand-assets" &&
                section !== "footer" &&
                section !== "page-banners" &&
                !loading ? (
                  <span className="shrink-0 rounded-full bg-line/50 px-2.5 py-0.5 text-xs font-semibold text-muted">
                    {count}
                  </span>
                ) : null}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted/70 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen ? (
                <div className="border-t border-line p-5">
                  {renderSectionBody(section)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
