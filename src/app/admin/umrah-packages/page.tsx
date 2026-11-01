"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import type { PackageRow } from "@/app/api/packages/route";
import {
  EMPTY_SEO_DRAFT,
  SeoFields,
  resolveSeoDraft,
  seoDraftFrom,
  seoTitleBudgetIssue,
} from "@/components/admin/seo-fields";
import { useBrand } from "@/components/shared/brand-provider";
import { suggestUmrahPackageSeo } from "@/lib/seo-suggestions";

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "badge-success",
  DRAFT: "badge-warning",
  ARCHIVED: "badge-neutral",
};

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  description: "",
  makkahNights: "7",
  madinahNights: "3",
  departureCity: "",
  airlineNotes: "",
  hotelSummary: "",
  inclusions: "",
  exclusions: "",
  basePrice: "",
  currency: "SAR",
  seatsAvailable: "0",
  startDate: "",
  endDate: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [seoDraft, setSeoDraft] = useState(EMPTY_SEO_DRAFT);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const brand = useBrand();
  const seoSuggestion = suggestUmrahPackageSeo(
    {
      ...formData,
      makkahNights: parseInt(formData.makkahNights) || 0,
      madinahNights: parseInt(formData.madinahNights) || 0,
      basePrice: parseFloat(formData.basePrice) || 0,
    },
    brand.name,
  );
  const editingSlug = packages.find((p) => p.id === editingId)?.slug;

  const totalNights =
    (parseInt(formData.makkahNights) || 0) +
    (parseInt(formData.madinahNights) || 0);
  const costPerNight =
    totalNights > 0 && parseFloat(formData.basePrice) > 0
      ? Math.round(parseFloat(formData.basePrice) / totalNights)
      : null;

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages?all=true");
      setIsDbOffline(res.headers.get("x-package-source") === "offline");
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) closeDrawer();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setSeoDraft(EMPTY_SEO_DRAFT);
    setError("");
    setDrawerOpen(true);
  };

  const startEdit = (p: PackageRow) => {
    setEditingId(p.id);
    setFormData({
      title: p.title,
      subtitle: p.subtitle ?? "",
      description: p.description,
      makkahNights: String(p.makkahNights),
      madinahNights: String(p.madinahNights),
      departureCity: p.departureCity,
      airlineNotes: p.airlineNotes ?? "",
      hotelSummary: p.hotelSummary ?? "",
      inclusions: p.inclusions.join("\n"),
      exclusions: p.exclusions.join("\n"),
      basePrice: String(p.basePrice),
      currency: p.currency,
      seatsAvailable: String(p.seatsAvailable),
      startDate: p.startDate.slice(0, 10),
      endDate: p.endDate.slice(0, 10),
      status: p.status,
    });
    setSeoDraft(seoDraftFrom(p, suggestUmrahPackageSeo(p, brand.name)));
    setError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setSeoDraft(EMPTY_SEO_DRAFT);
    setError("");
  };

  const handleSubmit = async (publishNow = false) => {
    setSaving(true);
    setError("");

    const seo = resolveSeoDraft(seoDraft, seoSuggestion);
    const titleIssue = seoTitleBudgetIssue(seo.seoTitle, brand.name);
    if (titleIssue) {
      setError(titleIssue);
      setSaving(false);
      return;
    }

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle || null,
      description: formData.description,
      makkahNights: parseInt(formData.makkahNights),
      madinahNights: parseInt(formData.madinahNights),
      departureCity: formData.departureCity,
      airlineNotes: formData.airlineNotes || null,
      hotelSummary: formData.hotelSummary || null,
      inclusions: formData.inclusions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      exclusions: formData.exclusions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      basePrice: parseFloat(formData.basePrice),
      currency: formData.currency,
      seatsAvailable: parseInt(formData.seatsAvailable),
      startDate: formData.startDate
        ? new Date(formData.startDate).toISOString()
        : "",
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : "",
      status: publishNow ? "PUBLISHED" : formData.status,
      ...seo,
    };

    try {
      const url = editingId ? `/api/packages/${editingId}` : "/api/packages";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Save failed");
      }
      setFormData(EMPTY_FORM);
      setSeoDraft(EMPTY_SEO_DRAFT);
      setEditingId(null);
      setDrawerOpen(false);
      await fetchPackages();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this package? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchPackages();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="btn btn-ghost btn-sm rounded-full gap-1.5"
        >
          <ArrowLeft size={14} /> Admin
        </Link>
        {isDbOffline && (
          <span className="badge badge-warning badge-outline text-xs">
            Database unavailable — changes won&apos;t be saved
          </span>
        )}
      </div>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">
              Current Inventory
            </p>
            <div className="mt-3 flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-foreground">
                Umrah packages
              </h1>
              <span className="badge badge-primary badge-outline">
                {packages.length} packages
              </span>
            </div>
          </div>
          <button
            className="btn btn-primary rounded-full gap-1.5 px-6"
            onClick={openCreate}
          >
            <Plus size={16} /> Add package
          </button>
        </div>

        {error && !drawerOpen && (
          <p className="mt-4 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-10 flex justify-center">
            <span className="loading loading-spinner loading-md text-brand" />
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((item) => {
            const nights = item.makkahNights + item.madinahNights;
            const cpn = nights > 0 ? Math.round(item.basePrice / nights) : null;
            return (
              <article
                key={item.id}
                className={`flex flex-col rounded-2xl border bg-white p-5 ${
                  drawerOpen && editingId === item.id
                    ? "border-brand ring-2 ring-brand/20"
                    : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {item.departureCity} &middot; {item.makkahNights}n Makkah
                      {item.madinahNights > 0 &&
                        ` + ${item.madinahNights}n Madinah`}
                    </p>
                  </div>
                  <span
                    className={`badge badge-outline shrink-0 ${STATUS_COLORS[item.status] ?? ""}`}
                  >
                    {item.status.toLowerCase()}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                  <span>
                    <strong className="text-brand-strong">
                      {item.currency} {item.basePrice.toLocaleString()}
                    </strong>{" "}
                    total
                  </span>
                  {cpn !== null && (
                    <span>
                      <strong className="text-foreground">
                        {item.currency} {cpn.toLocaleString()}
                      </strong>{" "}
                      / night
                    </span>
                  )}
                  <span>{item.seatsAvailable} seats</span>
                </div>

                {item.inclusions.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {item.inclusions.slice(0, 3).map((inc) => (
                      <li
                        key={inc}
                        className="rounded-full border border-black/5 bg-white px-3 py-0.5 text-xs text-muted"
                      >
                        {inc}
                      </li>
                    ))}
                    {item.inclusions.length > 3 && (
                      <li className="rounded-full border border-black/5 bg-white px-3 py-0.5 text-xs text-muted">
                        +{item.inclusions.length - 3} more
                      </li>
                    )}
                  </ul>
                )}

                <div className="mt-auto flex gap-2 pt-4">
                  <button
                    className="btn btn-ghost btn-sm rounded-full gap-1"
                    onClick={() => startEdit(item)}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm rounded-full gap-1 text-error hover:bg-error/10"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </article>
            );
          })}

          {!loading && packages.length === 0 && (
            <div className="py-12 text-center md:col-span-2 xl:col-span-3">
              <p className="text-sm text-muted">No packages yet.</p>
              <button
                className="btn btn-primary btn-sm mt-4 rounded-full gap-1.5"
                onClick={openCreate}
              >
                <Plus size={14} /> Add your first package
              </button>
            </div>
          )}
        </div>
      </section>

      {drawerOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex bg-navy/50"
            onClick={() => !saving && closeDrawer()}
          >
            <aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="package-drawer-title"
              className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-line px-6 py-5 sm:px-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-muted">
                    {editingId ? "Package Details" : "Package Creation"}
                  </p>
                  <h2
                    id="package-drawer-title"
                    className="mt-1 text-xl font-semibold text-navy"
                  >
                    {editingId
                      ? "Update Umrah Package"
                      : "Create Umrah Package"}
                  </h2>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-circle"
                  aria-label="Close"
                  disabled={saving}
                  onClick={closeDrawer}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pt-6 sm:px-8">
                {/* Cost preview */}
                {costPerNight !== null && (
                  <div className="flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand/5 px-5 py-3.5">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand">
                        Cost per night
                      </p>
                      <p className="text-2xl font-semibold text-brand-strong">
                        {formData.currency} {costPerNight.toLocaleString()}
                        <span className="ml-1.5 text-sm font-normal text-muted">
                          / night ({totalNights} nights total)
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`${costPerNight !== null ? "mt-6" : ""} grid gap-4 md:grid-cols-2`}
                >
                  <input
                    className="input input-bordered rounded-2xl bg-white md:col-span-2"
                    placeholder="Package title *"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                  <input
                    className="input input-bordered rounded-2xl bg-white md:col-span-2"
                    placeholder="Short subtitle (optional)"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                  />
                  <input
                    className="input input-bordered rounded-2xl bg-white"
                    placeholder="Departure city *"
                    value={formData.departureCity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departureCity: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      className="input input-bordered w-full rounded-2xl bg-white"
                      placeholder="Base price *"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, basePrice: e.target.value })
                      }
                    />
                    <input
                      className="input input-bordered w-20 rounded-2xl bg-white"
                      placeholder="SAR"
                      maxLength={3}
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currency: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label pb-1">
                      <span className="label-text text-muted">
                        Makkah nights *
                      </span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="input input-bordered w-full rounded-2xl bg-white"
                      value={formData.makkahNights}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          makkahNights: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label pb-1">
                      <span className="label-text text-muted">
                        Madinah nights
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="input input-bordered w-full rounded-2xl bg-white"
                      value={formData.madinahNights}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          madinahNights: e.target.value,
                        })
                      }
                    />
                  </div>
                  <input
                    type="date"
                    className="input input-bordered rounded-2xl bg-white"
                    title="Start date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    className="input input-bordered rounded-2xl bg-white"
                    title="End date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    className="input input-bordered rounded-2xl bg-white"
                    placeholder="Seats available"
                    value={formData.seatsAvailable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seatsAvailable: e.target.value,
                      })
                    }
                  />
                  <select
                    className="select select-bordered rounded-2xl bg-white"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as typeof formData.status,
                      })
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                  <input
                    className="input input-bordered rounded-2xl bg-white md:col-span-2"
                    placeholder="Airline notes (e.g. Saudia direct)"
                    value={formData.airlineNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, airlineNotes: e.target.value })
                    }
                  />
                  <input
                    className="input input-bordered rounded-2xl bg-white md:col-span-2"
                    placeholder="Hotel summary (e.g. Swissotel + Hilton)"
                    value={formData.hotelSummary}
                    onChange={(e) =>
                      setFormData({ ...formData, hotelSummary: e.target.value })
                    }
                  />
                  <div className="md:col-span-2">
                    <label className="label pb-1">
                      <span className="label-text text-muted">
                        Inclusions — one per line *
                      </span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered min-h-28 w-full rounded-2xl bg-white"
                      placeholder={
                        "Return air ticket\nHotel accommodation\nAirport transfers"
                      }
                      value={formData.inclusions}
                      onChange={(e) =>
                        setFormData({ ...formData, inclusions: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label pb-1">
                      <span className="label-text text-muted">
                        Exclusions — one per line
                      </span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered min-h-20 w-full rounded-2xl bg-white"
                      placeholder={"Personal expenses\nTravel insurance"}
                      value={formData.exclusions}
                      onChange={(e) =>
                        setFormData({ ...formData, exclusions: e.target.value })
                      }
                    />
                  </div>
                  <textarea
                    className="textarea textarea-bordered min-h-28 w-full rounded-2xl bg-white md:col-span-2"
                    placeholder="Package description *"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="mt-6">
                  <SeoFields
                    draft={seoDraft}
                    suggestion={seoSuggestion}
                    onChange={setSeoDraft}
                    path={`/umrah-packages/${
                      editingSlug ??
                      formData.title
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                    }`}
                  />
                </div>

                {error && (
                  <p className="mt-4 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
                    {error}
                  </p>
                )}

                <div className="sticky bottom-0 -mx-6 mt-6 flex flex-wrap gap-3 border-t border-line bg-white px-6 py-4 sm:-mx-8 sm:px-8">
                  <button
                    className="btn btn-primary rounded-full px-6"
                    disabled={saving}
                    onClick={() => handleSubmit(false)}
                  >
                    {saving ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Plus size={15} />
                    )}
                    {editingId ? "Update package" : "Save as draft"}
                  </button>
                  {!editingId && (
                    <button
                      className="btn btn-outline rounded-full px-6"
                      disabled={saving}
                      onClick={() => handleSubmit(true)}
                    >
                      Save &amp; publish
                    </button>
                  )}
                  <button
                    className="btn btn-ghost rounded-full px-6"
                    disabled={saving}
                    onClick={closeDrawer}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </main>
  );
}
