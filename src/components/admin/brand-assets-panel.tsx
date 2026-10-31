"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, ImageUp, Loader2, Trash2 } from "lucide-react";

import { MediaPickerDialog } from "@/components/admin/media-picker";

import {
  BRAND_ASSET_INFO,
  BRAND_ASSET_SLOTS,
  type BrandAssetSlot,
  type BrandAssets,
} from "@/lib/brand-assets";

const BRAND_ENDPOINT = "/api/admin/settings/brand";

async function readAssets(res: Response): Promise<BrandAssets> {
  const json = (await res.json()) as { assets?: BrandAssets; error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Request failed.");
  }
  return json.assets ?? {};
}

/**
 * Service icons, favicon and empty-state images. Each slot is uploaded to R2
 * and saved in brand settings; an empty slot keeps the built-in icon.
 */
export function BrandAssetsPanel() {
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
        if (!ignore) setError(err instanceof Error ? err.message : "Unable to load brand images.");
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
      formData.append("mediaType", "brand-assets");
      // The app icon doubles as the apple-touch-icon, which must stay PNG.
      if (slot === "icon") formData.append("target", "favicon");
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
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
      setError(err instanceof Error ? err.message : "Could not save the image.");
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
      setMessage(`${BRAND_ASSET_INFO[slot].label} reset to the default icon.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the image.");
    } finally {
      setBusySlot(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">{message}</div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">{error}</div>
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
        folder="brand-assets"
        title={pickerSlot ? `Choose ${BRAND_ASSET_INFO[pickerSlot].label}` : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BRAND_ASSET_SLOTS.map((slot) => {
          const url = assets[slot];
          const busy = busySlot === slot;

          return (
            <div key={slot} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex h-32 items-center justify-center rounded-2xl bg-slate-50">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- image is hosted on R2
                  <img src={url} alt={BRAND_ASSET_INFO[slot].label} className="max-h-28 max-w-full object-contain" />
                ) : (
                  <span className="text-xs font-medium text-slate-400">Using default icon</span>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{BRAND_ASSET_INFO[slot].label}</p>
              <p className="mt-1 flex-1 text-xs leading-5 text-slate-500">{BRAND_ASSET_INFO[slot].hint}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => chooseFile(slot)}
                  disabled={busySlot !== null}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5" />}
                  {url ? "Replace" : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => setPickerSlot(slot)}
                  disabled={busySlot !== null}
                  aria-label={`Choose ${BRAND_ASSET_INFO[slot].label} from the media library`}
                  title="Choose from library"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 hover:border-blue-400 hover:text-blue-700 disabled:opacity-60"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
                {url && (
                  <button
                    type="button"
                    onClick={() => handleRemove(slot)}
                    disabled={busySlot !== null}
                    aria-label={`Remove ${BRAND_ASSET_INFO[slot].label}`}
                    className="inline-flex items-center justify-center rounded-xl bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
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
