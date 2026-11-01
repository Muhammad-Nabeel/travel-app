"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, ImageUp, Loader2, Trash2 } from "lucide-react";

import {
  MediaPickerDialog,
  type MediaFolder,
} from "@/components/admin/media-picker";

import {
  BRAND_ASSET_INFO,
  BRAND_ASSET_SLOTS,
  hasBuiltInIcon,
  isFooterAssetSlot,
  type BrandAssetSlot,
  type BrandAssets,
} from "@/lib/brand-assets";

const BRAND_ENDPOINT = "/api/admin/settings/brand";

/** Footer slots live in Media → Footer; the rest in Media → Brand & Icons. */
const SLOT_GROUPS = {
  site: {
    slots: BRAND_ASSET_SLOTS.filter((slot) => !isFooterAssetSlot(slot)),
    folder: "brand-assets",
  },
  footer: {
    slots: BRAND_ASSET_SLOTS.filter(isFooterAssetSlot),
    folder: "footer-media",
  },
} satisfies Record<string, { slots: BrandAssetSlot[]; folder: MediaFolder }>;

async function readAssets(res: Response): Promise<BrandAssets> {
  const json = (await res.json()) as { assets?: BrandAssets; error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Request failed.");
  }
  return json.assets ?? {};
}

/**
 * Service icons, favicon and empty-state images (`site`), or the footer icons
 * (`footer`). Each slot is uploaded to R2 and saved in brand settings; an
 * empty slot keeps its built-in icon where one exists, otherwise shows none.
 */
export function BrandAssetsPanel({
  group = "site",
}: {
  group?: keyof typeof SLOT_GROUPS;
}) {
  const { slots, folder } = SLOT_GROUPS[group];
  const fileInput = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<BrandAssets>({});
  const [loading, setLoading] = useState(true);
  const [pendingSlot, setPendingSlot] = useState<BrandAssetSlot | null>(null);
  const [busySlot, setBusySlot] = useState<BrandAssetSlot | null>(null);
  const [pickerSlot, setPickerSlot] = useState<BrandAssetSlot | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(BRAND_ENDPOINT, { cache: "no-store" })
      .then(readAssets)
      .then((loaded) => {
        if (!ignore) setAssets(loaded);
      })
      .catch((err: unknown) => {
        if (!ignore)
          setError(
            err instanceof Error ? err.message : "Unable to load brand images.",
          );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function saveSlot(slot: BrandAssetSlot, url: string | null) {
    const res = await fetch(BRAND_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset: slot, url }),
    });
    setAssets(await readAssets(res));
  }

  function chooseFile(slot: BrandAssetSlot) {
    setPendingSlot(slot);
    fileInput.current?.click();
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const slot = pendingSlot;
    event.target.value = "";
    if (!file || !slot) return;

    setBusySlot(slot);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaType", folder);
      // The app icon doubles as the apple-touch-icon, which must stay PNG.
      if (slot === "icon") formData.append("target", "favicon");
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Upload failed.");
      }
      await saveSlot(slot, json.url);
      setMessage(`${BRAND_ASSET_INFO[slot].label} updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusySlot(null);
      setPendingSlot(null);
    }
  }

  async function handleLibrarySelect(slot: BrandAssetSlot, url: string) {
    setBusySlot(slot);
    setMessage("");
    setError("");
    try {
      await saveSlot(slot, url);
      setMessage(`${BRAND_ASSET_INFO[slot].label} updated.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the image.",
      );
    } finally {
      setBusySlot(null);
    }
  }

  async function handleRemove(slot: BrandAssetSlot) {
    setBusySlot(slot);
    setMessage("");
    setError("");
    try {
      await saveSlot(slot, null);
      setMessage(
        !hasBuiltInIcon(slot)
          ? `${BRAND_ASSET_INFO[slot].label} icon removed.`
          : `${BRAND_ASSET_INFO[slot].label} reset to the default icon.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove the image.",
      );
    } finally {
      setBusySlot(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-4 bg-success/8 border border-success/25 rounded-lg text-success">
          {message}
        </div>
      )}
      {error && (
        <div className="p-4 bg-deal/6 border border-deal/20 rounded-lg text-deal">
          {error}
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFile}
        className="hidden"
      />

      <MediaPickerDialog
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={(url) => {
          if (pickerSlot) void handleLibrarySelect(pickerSlot, url);
        }}
        folder={folder}
        title={
          pickerSlot
            ? `Choose ${BRAND_ASSET_INFO[pickerSlot].label}`
            : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot) => {
          const url = assets[slot];
          const busy = busySlot === slot;

          return (
            <div
              key={slot}
              className="flex flex-col rounded-3xl border border-line bg-white p-4"
            >
              <div className="flex h-32 items-center justify-center rounded-2xl bg-subtle">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- image is hosted on R2
                  <img
                    src={url}
                    alt={BRAND_ASSET_INFO[slot].label}
                    className="max-h-28 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-medium text-muted/70">
                    {!hasBuiltInIcon(slot)
                      ? "No icon shown"
                      : "Using default icon"}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-navy">
                {BRAND_ASSET_INFO[slot].label}
              </p>
              <p className="mt-1 flex-1 text-xs leading-5 text-muted">
                {BRAND_ASSET_INFO[slot].hint}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => chooseFile(slot)}
                  disabled={busySlot !== null}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImageUp className="h-3.5 w-3.5" />
                  )}
                  {url ? "Replace" : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => setPickerSlot(slot)}
                  disabled={busySlot !== null}
                  aria-label={`Choose ${BRAND_ASSET_INFO[slot].label} from the media library`}
                  title="Choose from library"
                  className="inline-flex items-center justify-center rounded-xl border border-line-strong bg-white px-3 py-2 text-navy/80 hover:border-brand hover:text-brand-strong disabled:opacity-60"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
                {url && (
                  <button
                    type="button"
                    onClick={() => handleRemove(slot)}
                    disabled={busySlot !== null}
                    aria-label={`Remove ${BRAND_ASSET_INFO[slot].label}`}
                    className="inline-flex items-center justify-center rounded-xl bg-deal/6 px-3 py-2 text-deal hover:bg-deal/10 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
