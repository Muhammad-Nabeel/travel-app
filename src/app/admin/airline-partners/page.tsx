"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { AirlinePartnerRow } from "@/lib/airline-partners";

const EMPTY_FORM = {
  name: "",
  isActive: true,
};

type FormState = typeof EMPTY_FORM;

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export default function AdminAirlinePartnersPage() {
  const [partners, setPartners] = useState<AirlinePartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AirlinePartnerRow | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/airline-partners", {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        airlinePartners?: AirlinePartnerRow[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not load airline partners.");
      }
      setPartners(data.airlinePartners ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load airline partners.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPartners();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function resetFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function scrollToForm() {
    setTimeout(
      () => formRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  function openNew() {
    setEditing(null);
    setFormData(EMPTY_FORM);
    resetFile();
    setError("");
    setShowForm(true);
    scrollToForm();
  }

  function openEdit(partner: AirlinePartnerRow) {
    setEditing(partner);
    setFormData({ name: partner.name, isActive: partner.isActive });
    resetFile();
    setError("");
    setShowForm(true);
    scrollToForm();
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    resetFile();
    setError("");
  }

  async function savePartner(
    id: string | null,
    values: FormState,
    logo: File | null,
  ) {
    const body = new FormData();
    body.append("name", values.name.trim());
    body.append("isActive", String(values.isActive));
    if (logo) body.append("file", logo);

    const res = await fetch(
      id ? `/api/admin/airline-partners/${id}` : "/api/admin/airline-partners",
      { method: id ? "PUT" : "POST", body },
    );

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      throw new Error(err.error ?? "Failed to save airline partner");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Airline name is required.");
      return;
    }
    if (!editing && !file) {
      setError("Logo image is required.");
      return;
    }

    setSaving(true);
    try {
      await savePartner(editing?.id ?? null, formData, file);
      await fetchPartners();
      closeForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save airline partner",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(partner: AirlinePartnerRow) {
    if (!confirm(`Delete ${partner.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/airline-partners/${partner.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      await fetchPartners();
    } catch {
      setError("Failed to delete airline partner.");
    }
  }

  async function toggleActive(partner: AirlinePartnerRow) {
    try {
      await savePartner(
        partner.id,
        { name: partner.name, isActive: !partner.isActive },
        null,
      );
      await fetchPartners();
    } catch {
      setError("Failed to update airline partner status.");
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= partners.length) return;

    const reordered = [...partners];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPartners(reordered);

    try {
      const res = await fetch("/api/admin/airline-partners/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("Failed to reorder airline partners.");
      await fetchPartners();
    }
  }

  const currentLogo = preview ?? editing?.logoUrl ?? null;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-navy">Airline Partners</h1>
          <p className="mt-1 text-sm text-muted">
            Logos shown in the &ldquo;Book with leading airlines&rdquo; strip on
            the homepage, in this order.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          <Plus className="h-4 w-4" />
          Add Airline
        </button>
      </div>

      {error && !showForm && (
        <p className="rounded-xl bg-deal/6 px-4 py-2.5 text-sm text-deal">
          {error}
        </p>
      )}

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div
          ref={formRef}
          className="rounded-2xl border border-line bg-white p-6 shadow-card"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">
              {editing ? "Edit Airline" : "Add Airline"}
            </h2>
            <button
              onClick={closeForm}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-line/50"
              aria-label="Close form"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-xl bg-deal/6 px-4 py-2.5 text-sm text-deal">
              {error}
            </p>
          )}

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="grid gap-4 sm:grid-cols-[1fr_200px]"
          >
            <div className="grid content-start gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Airline Name *
                </span>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Emirates"
                  className={INPUT_CLASS}
                />
                <span className="text-xs text-muted">
                  Used as the logo&apos;s alt text.
                </span>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Logo Image {editing ? "(leave empty to keep current)" : "*"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand"
                />
                <span className="text-xs text-muted">
                  PNG, JPG, WebP or SVG, up to 5MB. A transparent or white
                  background looks best.
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-line-strong accent-brand"
                />
                <span className="text-sm font-medium text-navy/80">
                  Show on homepage
                </span>
              </label>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Preview
              </span>
              <div className="mt-1 flex h-20 w-full items-center justify-center rounded-xl border border-line bg-white px-4 py-3">
                {currentLogo ? (
                  // Blob previews can't go through next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentLogo}
                    alt=""
                    className="max-h-12 w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted/70">No logo yet</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-muted hover:bg-subtle"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Airline"
                    : "Add Airline"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Partner list ── */}
      <section className="rounded-2xl border border-line bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold text-navy">
            All Airlines{" "}
            <span className="ml-1.5 rounded-full bg-line/50 px-2 py-0.5 text-xs font-medium text-muted">
              {partners.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-muted/70">
            Loading airline partners…
          </p>
        ) : partners.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted/70">
            No airline partners yet. The airlines strip stays hidden on the
            homepage until you add one.
          </p>
        ) : (
          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {partners.map((partner, index) => (
              <article
                key={partner.id}
                className="flex flex-col rounded-xl border border-line p-3"
              >
                <div
                  className={`flex h-20 items-center justify-center rounded-lg border border-line bg-white px-4 py-3 ${
                    partner.isActive ? "" : "opacity-50"
                  }`}
                >
                  <Image
                    src={partner.logoUrl}
                    alt={partner.name}
                    width={128}
                    height={56}
                    className="max-h-12 w-auto object-contain"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-navy">
                    {partner.name}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      partner.isActive
                        ? "bg-success/8 text-success"
                        : "bg-line/50 text-muted"
                    }`}
                  >
                    {partner.isActive ? "Live" : "Hidden"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    onClick={() => void move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${partner.name} earlier`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-subtle disabled:opacity-40"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void move(index, 1)}
                    disabled={index === partners.length - 1}
                    aria-label={`Move ${partner.name} later`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-subtle disabled:opacity-40"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <div className="ml-auto flex gap-1.5">
                    <button
                      onClick={() => void toggleActive(partner)}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-subtle"
                    >
                      {partner.isActive ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => openEdit(partner)}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-subtle"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete(partner)}
                      className="rounded-lg border border-deal/20 px-2.5 py-1.5 text-xs font-medium text-deal transition hover:bg-deal/6"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
