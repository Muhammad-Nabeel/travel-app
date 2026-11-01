"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { ZodError } from "zod";
import { TOUR_TYPES, tourPackageSchema } from "@/lib/validations/tour-package";
import { MediaUrlInput } from "@/components/admin/media-picker";
import {
  EMPTY_SEO_DRAFT,
  SeoFields,
  resolveSeoDraft,
  seoDraftFrom,
  seoTitleBudgetIssue,
} from "@/components/admin/seo-fields";
import { useBrand } from "@/components/shared/brand-provider";
import { suggestTourPackageSeo } from "@/lib/seo-suggestions";
import {
  getTourPackagePath,
  toTourPackageSlug,
  type TourPackage,
} from "@/lib/tour-packages";

const EMPTY_FORM = {
  title: "",
  destination: "",
  tourType: "cultural",
  duration: "7",
  description: "",
  highlights: "",
  imageUrl: "",
  pricePerAdult: "",
  pricePerChild: "",
  currency: "USD",
  rating: "4.5",
  reviewCount: "0",
  sortOrder: "0",
  isActive: true,
};

/** Highlights are edited one per line. */
function toHighlights(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function AdminTourPackagesPage() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [seoDraft, setSeoDraft] = useState(EMPTY_SEO_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const brand = useBrand();

  const seoSuggestion = suggestTourPackageSeo(
    {
      title: formData.title,
      destination: formData.destination,
      duration: Number(formData.duration) || 0,
      highlights: toHighlights(formData.highlights),
      pricePerAdult: Number(formData.pricePerAdult) || 0,
      currency: formData.currency,
    },
    brand.name,
  );

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/tour-packages?all=true");
      setIsOffline(res.headers.get("x-tour-package-source") === "offline");
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load tour packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const startEdit = (pkg: TourPackage) => {
    setEditingId(pkg.id);
    setEditingSlug(pkg.slug);
    setFormData({
      title: pkg.title,
      destination: pkg.destination,
      tourType: pkg.tourType,
      duration: String(pkg.duration),
      description: pkg.description,
      highlights: pkg.highlights.join("\n"),
      imageUrl: pkg.imageUrl,
      pricePerAdult: String(pkg.pricePerAdult),
      pricePerChild: String(pkg.pricePerChild),
      currency: pkg.currency,
      rating: String(pkg.rating),
      reviewCount: String(pkg.reviewCount),
      sortOrder: String(pkg.sortOrder),
      isActive: pkg.isActive,
    });
    setSeoDraft(seoDraftFrom(pkg, suggestTourPackageSeo(pkg, brand.name)));
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingSlug(null);
    setFormData(EMPTY_FORM);
    setSeoDraft(EMPTY_SEO_DRAFT);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const seo = resolveSeoDraft(seoDraft, seoSuggestion);
      const titleIssue = seoTitleBudgetIssue(seo.seoTitle, brand.name);
      if (titleIssue) {
        setError(titleIssue);
        return;
      }

      const validatedData = tourPackageSchema.parse({
        title: formData.title,
        destination: formData.destination,
        tourType: formData.tourType,
        duration: formData.duration,
        description: formData.description,
        highlights: toHighlights(formData.highlights),
        imageUrl: formData.imageUrl,
        pricePerAdult: formData.pricePerAdult,
        pricePerChild: formData.pricePerChild,
        currency: formData.currency,
        rating: formData.rating,
        reviewCount: formData.reviewCount,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
        ...seo,
      });

      const isUpdate = editingId && editingId !== "new";
      const res = await fetch(
        isUpdate ? `/api/tour-packages/${editingId}` : "/api/tour-packages",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validatedData),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ??
            `Failed to ${isUpdate ? "update" : "add"} tour package.`,
        );
      } else {
        cancelEdit();
        await fetchPackages();
      }
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        setError(message);
      } else if (err instanceof Error) {
        setError(err.message || "Validation failed");
      } else {
        setError("Network error.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/tour-packages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to delete.");
      } else {
        await fetchPackages();
      }
    } catch {
      setError("Network error.");
    }
  };

  const field = (key: keyof typeof formData) => ({
    value: String(formData[key]),
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setFormData((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const inputClass =
    "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-muted hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
        <span className="text-muted/50">/</span>
        <span className="text-sm font-semibold text-navy">Tour Packages</span>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-navy">
              Tour Package Management
            </h1>
            <p className="mt-2 text-sm text-muted">
              Create, edit and remove the holiday packages listed on the tour
              packages page.
            </p>
          </div>
          {editingId === null && (
            <button
              onClick={() => {
                setEditingId("new");
                setEditingSlug(null);
                setFormData(EMPTY_FORM);
                setSeoDraft(EMPTY_SEO_DRAFT);
              }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/85"
            >
              <Plus className="h-4 w-4" />
              Add Package
            </button>
          )}
        </div>

        {/* Form */}
        {editingId !== null && (
          <div className="mt-6 rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/80">
                {editingId === "new" ? "New tour package" : "Edit tour package"}
              </h2>
              <button onClick={cancelEdit} aria-label="Cancel">
                <X className="h-4 w-4 text-muted hover:text-navy" />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-deal/6 px-4 py-2.5 text-sm text-deal">
                {error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Title *
                </span>
                <input
                  {...field("title")}
                  placeholder="e.g. Golden Dubai Explorer"
                  maxLength={100}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Destination *
                </span>
                <input
                  {...field("destination")}
                  placeholder="e.g. Dubai, UAE"
                  maxLength={100}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Tour type
                </span>
                <select {...field("tourType")} className={`${inputClass} capitalize`}>
                  {TOUR_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Duration (days) *
                </span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  {...field("duration")}
                  className={inputClass}
                />
              </label>

              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <span className="text-xs font-semibold text-muted">
                  Image *
                </span>
                <MediaUrlInput
                  value={formData.imageUrl}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, imageUrl: url }))
                  }
                  folder="tour-images"
                  placeholder="Choose from the library or paste a URL"
                />
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Price per adult *
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...field("pricePerAdult")}
                  placeholder="e.g. 1299"
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Price per child *
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...field("pricePerChild")}
                  placeholder="e.g. 649"
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Currency *
                </span>
                <input
                  {...field("currency")}
                  placeholder="USD"
                  maxLength={3}
                  className={`${inputClass} uppercase`}
                />
              </label>

              <label className="flex flex-col gap-1.5 lg:col-span-3">
                <span className="text-xs font-semibold text-muted">
                  Description *
                </span>
                <textarea
                  {...field("description")}
                  placeholder="Shown in the Overview section of the package page."
                  maxLength={2000}
                  rows={3}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5 lg:col-span-3">
                <span className="text-xs font-semibold text-muted">
                  Highlights * (one per line)
                </span>
                <textarea
                  {...field("highlights")}
                  placeholder={"Burj Khalifa visit\nDesert safari\nDhow cruise dinner"}
                  rows={4}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Rating
                </span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  {...field("rating")}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Review Count
                </span>
                <input
                  type="number"
                  min={0}
                  {...field("reviewCount")}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Sort Order
                </span>
                <input
                  type="number"
                  min={0}
                  {...field("sortOrder")}
                  className={inputClass}
                />
              </label>

              <label className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-line-strong"
                />
                <span className="text-sm font-medium text-navy/80">
                  Active (visible on the site)
                </span>
              </label>
            </div>

            <div className="mt-5">
              <SeoFields
                draft={seoDraft}
                suggestion={seoSuggestion}
                onChange={setSeoDraft}
                path={getTourPackagePath(
                  editingSlug ?? toTourPackageSlug(formData.title),
                )}
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/85 disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editingId === "new"
                    ? "Add Package"
                    : "Save Changes"}
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-lg border border-line-strong px-5 py-2.5 text-sm font-medium text-navy/80 transition hover:bg-subtle"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && editingId === null && (
          <p className="mt-6 rounded-lg bg-deal/6 px-4 py-2.5 text-sm text-deal">
            {error}
          </p>
        )}

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
          {loading ? (
            <p className="p-6 text-sm text-muted">Loading tour packages…</p>
          ) : packages.length === 0 ? (
            <p className="p-6 text-sm text-muted">
              No tour packages yet. Add one above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-subtle text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="bg-white transition hover:bg-subtle">
                    <td className="px-4 py-3 font-medium text-navy">
                      {pkg.title}
                    </td>
                    <td className="px-4 py-3 text-muted">{pkg.destination}</td>
                    <td className="px-4 py-3 capitalize text-muted">
                      {pkg.tourType}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {pkg.duration} {pkg.duration === 1 ? "day" : "days"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {pkg.currency} {pkg.pricePerAdult.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {pkg.rating.toFixed(1)} ⭐ ({pkg.reviewCount})
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          pkg.isActive
                            ? "bg-success/8 text-success"
                            : "bg-line/50 text-muted"
                        }`}
                      >
                        {pkg.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {pkg.isActive && (
                          <a
                            href={getTourPackagePath(pkg.slug)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-navy/80 transition hover:bg-line/50"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        )}
                        <button
                          onClick={() => startEdit(pkg)}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-navy/80 transition hover:bg-line/50"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id, pkg.title)}
                          className="flex items-center gap-1 rounded-lg border border-deal/20 px-2.5 py-1.5 text-xs font-medium text-deal transition hover:bg-deal/6"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && isOffline && (
          <p className="mt-3 text-xs text-gold-strong">
            ⚠ The database is unavailable — tour packages cannot be loaded or
            saved. Confirm{" "}
            <code className="rounded bg-gold/10 px-1">DATABASE_URL</code> is
            set and{" "}
            <code className="rounded bg-gold/10 px-1">
              npm run prisma:deploy
            </code>{" "}
            has been run.
          </p>
        )}
      </div>
    </main>
  );
}
