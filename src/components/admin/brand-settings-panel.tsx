"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, ImageUp, Loader2, Trash2 } from "lucide-react";

import { MediaPickerDialog } from "@/components/admin/media-picker";

import type { PublicBrand } from "@/lib/admin-settings/brand-settings";

const ENDPOINT = "/api/admin/settings/brand";

async function readResponse(res: Response): Promise<PublicBrand> {
  const json = (await res.json()) as Partial<PublicBrand> & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Request failed.");
  }
  return { name: json.name ?? "", logoUrl: json.logoUrl ?? null, assets: json.assets ?? {} };
}

/** Brand name and logo (stored on Cloudflare R2), used across the whole site. */
export function BrandSettingsPanel() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState<PublicBrand>({ name: "", logoUrl: null, assets: {} });
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"name" | "upload" | "library" | "remove" | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(ENDPOINT, { cache: "no-store" })
      .then(readResponse)
      .then((loaded) => {
        if (ignore) return;
        setBrand(loaded);
        setName(loaded.name);
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Unable to load brand settings.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function run(action: "name" | "upload" | "library" | "remove", request: () => Promise<Response>, done: string) {
    setBusy(action);
    setMessage("");
    setError("");
    try {
      const saved = await readResponse(await request());
      setBrand(saved);
      setName(saved.name);
      setMessage(done);
      // Re-render the admin shell so the new name and logo show immediately.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(null);
    }
  }

  function saveName() {
    void run(
      "name",
      () =>
        fetch(ENDPOINT, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }),
      "Brand name saved.",
    );
  }

  function uploadLogo(file: File) {
    const body = new FormData();
    body.append("file", file);
    void run("upload", () => fetch(ENDPOINT, { method: "POST", body }), "Logo uploaded.");
  }

  function selectLogo(logoUrl: string) {
    void run(
      "library",
      () =>
        fetch(ENDPOINT, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logoUrl }),
        }),
      "Logo updated.",
    );
  }

  function removeLogo() {
    void run("remove", () => fetch(ENDPOINT, { method: "DELETE" }), "Logo removed.");
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading brand settings...</p>;
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Brand
      </p>
      <h2 className="mt-2 text-xl font-semibold text-blue-950">Brand Name & Logo</h2>
      <p className="mt-1 text-sm text-blue-800/80">
        Shown in the header, footer, page titles, emails and search results.
        Logos are stored on Cloudflare R2.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="brand-name" className="text-xs font-semibold text-slate-600">
            Brand Name
          </label>
          <input
            id="brand-name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="EasyTrip"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
          <div>
            <button
              type="button"
              onClick={saveName}
              disabled={busy !== null || !name.trim() || name.trim() === brand.name}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {busy === "name" ? "Saving..." : "Save Name"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-600">Logo</span>
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo is hosted on R2
              <img src={brand.logoUrl} alt={`${brand.name} logo`} className="max-h-full w-auto object-contain" />
            ) : (
              <span className="text-sm text-slate-500">No logo. The brand name is shown instead.</span>
            )}
          </div>
          <p className="text-xs text-slate-500">PNG, JPG, WebP or SVG, up to 2 MB. A wide logo about 36 px tall works best.</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) uploadLogo(file);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
              {brand.logoUrl ? "Replace Logo" : "Upload Logo"}
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700 disabled:opacity-60"
            >
              {busy === "library" ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
              From Library
            </button>
            {brand.logoUrl ? (
              <button
                type="button"
                onClick={removeLogo}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
              >
                <Trash2 className="size-4" />
                {busy === "remove" ? "Removing..." : "Remove"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={selectLogo}
        folder="website-logo"
        title="Choose a logo"
      />

      {message ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
