"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type AirlineLogoEntry = {
  id: string;
  name: string;
  src: string;
  storagePath: string | null;
  isActive: boolean;
  sortOrder: number;
};

export default function AdminLogosPage() {
  const [logos, setLogos] = useState<AirlineLogoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadLogos() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/settings/airline-logos", {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        logos?: AirlineLogoEntry[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? "Unable to load logos.");
      }

      setLogos(Array.isArray(json.logos) ? json.logos : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load logos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogos();
  }, []);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Please choose an image file.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name.trim());

      const res = await fetch("/api/admin/settings/airline-logos", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Upload failed.");
      }

      setName("");
      setFile(null);
      setMessage("Logo uploaded successfully.");
      await loadLogos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/settings/airline-logos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Delete failed.");
      }

      setMessage("Logo removed successfully.");
      await loadLogos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Airline Logos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload and remove logos from Firebase Storage.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Airline name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emirates"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Logo image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block h-10 w-full text-sm text-slate-600"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={uploading}
              className="h-10 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload logo"}
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Current logos</h2>

        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading logos...</p>
        ) : logos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No logos uploaded yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {logos.map((logo) => (
              <article
                key={logo.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex h-20 items-center justify-center rounded-lg bg-slate-50">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={120}
                    height={50}
                    className="max-h-12 w-auto object-contain"
                  />
                </div>
                <p className="mt-2 truncate text-sm font-medium text-slate-800">
                  {logo.name}
                </p>
                <button
                  type="button"
                  onClick={() => void handleDelete(logo.id)}
                  disabled={deletingId === logo.id}
                  className="mt-2 w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                >
                  {deletingId === logo.id ? "Removing..." : "Remove"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
