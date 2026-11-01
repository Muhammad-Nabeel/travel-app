"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import { ZodError } from "zod";
import { activitySchema } from "@/lib/validations/activity";
import { MediaUrlInput } from "@/components/admin/media-picker";
import {
  EMPTY_SEO_DRAFT,
  SeoFields,
  resolveSeoDraft,
  seoDraftFrom,
  seoTitleBudgetIssue,
} from "@/components/admin/seo-fields";
import { useBrand } from "@/components/shared/brand-provider";
import { suggestActivitySeo } from "@/lib/seo-suggestions";

type Activity = {
  id: string;
  destinationId: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string;
  cost: string;
  reviews: number;
  reviewCount: number;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
};

type Destination = {
  id: string;
  city: string;
  country: string;
};

const CATEGORY_OPTIONS = [
  { value: "tourist-attraction", label: "Tourist Attraction" },
  { value: "seaside", label: "Seaside" },
  { value: "cultural", label: "Cultural" },
  { value: "adventure", label: "Adventure" },
  { value: "food", label: "Food & Dining" },
  { value: "shopping", label: "Shopping" },
];

const EMPTY_FORM = {
  destinationId: "",
  title: "",
  category: "tourist-attraction",
  description: "",
  imageUrl: "",
  cost: "",
  reviews: "4.5",
  reviewCount: "0",
  sortOrder: "0",
  isActive: true,
};

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isActivitySourceDummy, setIsActivitySourceDummy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [seoDraft, setSeoDraft] = useState(EMPTY_SEO_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const brand = useBrand();

  const cityOf = (destinationId: string) =>
    destinations.find((d) => d.id === destinationId)?.city ?? null;
  const seoSuggestion = suggestActivitySeo(
    { ...formData, city: cityOf(formData.destinationId) },
    brand.name,
  );

  const fetchDestinations = async () => {
    try {
      const res = await fetch("/api/destinations?all=true");
      const data = await res.json();
      setDestinations(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to load destinations");
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activities?all=true");
      setIsActivitySourceDummy(
        res.headers.get("x-activity-source") === "dummy",
      );
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
    fetchActivities();
  }, []);

  const startEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setFormData({
      destinationId: activity.destinationId,
      title: activity.title,
      category: activity.category,
      description: activity.description ?? "",
      imageUrl: activity.imageUrl,
      cost: activity.cost,
      reviews: String(activity.reviews),
      reviewCount: String(activity.reviewCount),
      sortOrder: String(activity.sortOrder),
      isActive: activity.isActive,
    });
    setSeoDraft(
      seoDraftFrom(
        activity,
        suggestActivitySeo(
          { ...activity, city: cityOf(activity.destinationId) },
          brand.name,
        ),
      ),
    );
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
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

      const validatedData = activitySchema.parse({
        destinationId: formData.destinationId,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        imageUrl: formData.imageUrl,
        cost: formData.cost,
        reviews: Number(formData.reviews),
        reviewCount: Number(formData.reviewCount),
        sortOrder: Number(formData.sortOrder),
        isActive: formData.isActive,
        ...seo,
      });

      const url =
        editingId && editingId !== "new"
          ? `/api/activities/${editingId}`
          : "/api/activities";
      const method = editingId && editingId !== "new" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ??
            `Failed to ${editingId && editingId !== "new" ? "update" : "add"} activity.`,
        );
      } else {
        cancelEdit();
        await fetchActivities();
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
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to delete.");
      } else {
        await fetchActivities();
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

  const destinationName = (id: string) => {
    const dest = destinations.find((d) => d.id === id);
    return dest ? `${dest.city}, ${dest.country}` : id;
  };

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
        <span className="text-sm font-semibold text-navy">Activities</span>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-navy">
              Activity Management
            </h1>
            <p className="mt-2 text-sm text-muted">
              Manage the activities and experiences published across the
              customer-facing storefront.
            </p>
          </div>
          {editingId === null && (
            <button
              onClick={() => {
                setEditingId("new");
                setFormData(EMPTY_FORM);
                setSeoDraft(EMPTY_SEO_DRAFT);
              }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/85"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </button>
          )}
        </div>

        {/* Form */}
        {editingId !== null && (
          <div className="mt-6 rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/80">
                {editingId === "new" ? "New activity" : "Edit activity"}
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
                  Destination *
                </span>
                <select
                  {...field("destinationId")}
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="">Select destination</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.city}, {d.country}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Title *
                </span>
                <input
                  {...field("title")}
                  placeholder="e.g. Desert Safari"
                  maxLength={100}
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Category
                </span>
                <select
                  {...field("category")}
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
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
                  folder="activities-images"
                  type="url"
                  placeholder="Choose from the library or paste a URL"
                />
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
                  Cost *
                </span>
                <input
                  {...field("cost")}
                  placeholder="e.g. PKR 5,000"
                  maxLength={40}
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>

              <label className="flex flex-col gap-1.5 lg:col-span-3">
                <span className="text-xs font-semibold text-muted">
                  Description
                </span>
                <textarea
                  {...field("description")}
                  placeholder="Describe this activity..."
                  maxLength={500}
                  rows={3}
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
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
                  {...field("reviews")}
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
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
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
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
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
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
                  Active (visible on homepage)
                </span>
              </label>
            </div>

            <div className="mt-5">
              <SeoFields
                draft={seoDraft}
                suggestion={seoSuggestion}
                onChange={setSeoDraft}
                path={`/activities/${`${formData.title} ${cityOf(formData.destinationId) ?? ""}`
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}`}
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
                    ? "Add Activity"
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

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
          {loading ? (
            <p className="p-6 text-sm text-muted">Loading activities…</p>
          ) : activities.length === 0 ? (
            <p className="p-6 text-sm text-muted">
              No activities yet. Add one above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-subtle text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="bg-white transition hover:bg-subtle"
                  >
                    <td className="px-4 py-3 font-medium text-navy">
                      {activity.title}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {destinationName(activity.destinationId)}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">
                      {activity.category.replace("-", " ")}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {activity.cost}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {activity.reviews.toFixed(1)} ⭐ ({activity.reviewCount})
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          activity.isActive
                            ? "bg-success/8 text-success"
                            : "bg-line/50 text-muted"
                        }`}
                      >
                        {activity.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(activity)}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-navy/80 transition hover:bg-line/50"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(activity.id, activity.title)
                          }
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

        {!loading && isActivitySourceDummy && (
          <p className="mt-3 text-xs text-gold-strong">
            ⚠ Showing dummy data — write operations are currently unavailable.
            Confirm your database server is running and that{" "}
            <code className="rounded bg-gold/10 px-1">DATABASE_URL</code> is
            set and{" "}
            <code className="rounded bg-gold/10 px-1">
              npm run prisma:migrate
            </code>{" "}
            is run.
          </p>
        )}
      </div>
    </main>
  );
}
