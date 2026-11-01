"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, ImageIcon, ImageUp, Loader2, RotateCcw } from "lucide-react";

import { MediaPickerDialog } from "@/components/admin/media-picker";

import {
  BUILT_IN_PAGE_BANNERS,
  PAGE_BANNER_INFO,
  PAGE_BANNER_SLOTS,
  type PageBannerSlot,
  type PageBanners,
} from "@/lib/page-banners";

const BANNERS_ENDPOINT = "/api/admin/settings/banners";

async function readBanners(res: Response): Promise<PageBanners> {
  const json = (await res.json()) as { banners?: PageBanners; error?: string };
  if (!res.ok || !json.banners) {
    throw new Error(json.error ?? "Request failed.");
  }
  return json.banners;
}

/**
 * Hero banner for each service page. Uploads go to R2 and are saved in the
 * page banner settings; "Reset" puts back the photo the page shipped with.
 */
export function PageBannersPanel() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [banners, setBanners] = useState<PageBanners | null>(null);
  const [pendingSlot, setPendingSlot] = useState<PageBannerSlot | null>(null);
  const [busySlot, setBusySlot] = useState<PageBannerSlot | null>(null);
  const [pickerSlot, setPickerSlot] = useState<PageBannerSlot | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(BANNERS_ENDPOINT, { cache: "no-store" })
      .then(readBanners)
      .then((loaded) => {
        if (!ignore) setBanners(loaded);
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Unable to load page banners.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function saveSlot(slot: PageBannerSlot, url: string | null) {
    const res = await fetch(BANNERS_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, url }),
    });
    setBanners(await readBanners(res));
  }

  async function run(slot: PageBannerSlot, action: () => Promise<void>, done: string) {
    setBusySlot(slot);
    setMessage("");
    setError("");
    try {
      await action();
      setMessage(done);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the banner.");
    } finally {
      setBusySlot(null);
    }
  }

  function chooseFile(slot: PageBannerSlot) {
    setPendingSlot(slot);
    fileInput.current?.click();
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const slot = pendingSlot;
    event.target.value = "";
    setPendingSlot(null);
    if (!file || !slot) return;

    void run(
      slot,
      async () => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mediaType", "page-banners");
        const res = await fetch("/api/admin/media", { method: "POST", body: formData });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !json.url) {
          throw new Error(json.error ?? "Upload failed.");
        }
        await saveSlot(slot, json.url);
      },
      `${PAGE_BANNER_INFO[slot].label} banner updated.`,
    );
  }

  if (!banners) {
    return error ? (
      <div className="p-4 bg-deal/6 border border-deal/20 rounded-lg text-deal">{error}</div>
    ) : (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-4 bg-success/8 border border-success/25 rounded-lg text-success">{message}</div>
      )}
      {error && (
        <div className="p-4 bg-deal/6 border border-deal/20 rounded-lg text-deal">{error}</div>
      )}

      <p className="text-xs leading-5 text-muted">
        Wide landscape photos work best (at least 1920 × 800). The top of the
        page sits over the image, so keep the subject near the centre.
      </p>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      <MediaPickerDialog
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={(url) => {
          const slot = pickerSlot;
          if (slot) void run(slot, () => saveSlot(slot, url), `${PAGE_BANNER_INFO[slot].label} banner updated.`);
        }}
        folder="page-banners"
        title={pickerSlot ? `Choose ${PAGE_BANNER_INFO[pickerSlot].label} banner` : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PAGE_BANNER_SLOTS.map((slot) => {
          const url = banners[slot];
          const { label, path } = PAGE_BANNER_INFO[slot];
          const isBuiltIn = url === BUILT_IN_PAGE_BANNERS[slot];
          const busy = busySlot === slot;

          return (
            <div key={slot} className="flex flex-col rounded-3xl border border-line bg-white p-4">
              <div className="relative aspect-[12/5] overflow-hidden rounded-2xl bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an R2 or built-in image */}
                <img src={url} alt={`${label} banner`} className="h-full w-full object-cover" />
                {isBuiltIn ? (
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Built-in
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy">{label}</p>
                <a
                  href={path}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand-strong"
                >
                  {path}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => chooseFile(slot)}
                  disabled={busySlot !== null}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5" />}
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setPickerSlot(slot)}
                  disabled={busySlot !== null}
                  aria-label={`Choose ${label} banner from the media library`}
                  title="Choose from library"
                  className="inline-flex items-center justify-center rounded-xl border border-line-strong bg-white px-3 py-2 text-navy/80 hover:border-brand hover:text-brand-strong disabled:opacity-60"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
                {!isBuiltIn && (
                  <button
                    type="button"
                    onClick={() => void run(slot, () => saveSlot(slot, null), `${label} banner reset to the built-in photo.`)}
                    disabled={busySlot !== null}
                    aria-label={`Reset ${label} banner to the built-in photo`}
                    title="Reset to built-in photo"
                    className="inline-flex items-center justify-center rounded-xl bg-deal/6 px-3 py-2 text-deal hover:bg-deal/10 disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
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
