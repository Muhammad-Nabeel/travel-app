"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import { ZodError } from "zod";
import { activitySchema } from "@/lib/validations/activity";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
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
    <main className="section-shell flex-1 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-900">Activities</span>
      </div>

      <div className="surface ring-soft rounded-4xl border border-white/80 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">
              Admin
            </p>
            <h1 className="display-font mt-1 text-4xl text-brand-strong">
              Trending Activities
            </h1>
            <p className="mt-2 text-sm text-muted">
              Manage activities and experiences shown on the homepage.
            </p>
          </div>
          {editingId === null && (
            <button
              onClick={() => {
                setEditingId("new");
                setFormData(EMPTY_FORM);
              }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </button>
          )}
        </div>

        {/* Form */}
        {editingId !== null && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {editingId === "new" ? "New activity" : "Edit activity"}
              </h2>
              <button onClick={cancelEdit} aria-label="Cancel">
                <X className="h-4 w-4 text-slate-500 hover:text-slate-900" />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Destination *
                </span>
                <select
                  {...field("destinationId")}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
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
                <span className="text-xs font-semibold text-slate-600">
                  Title *
                </span>
                <input
                  {...field("title")}
                  placeholder="e.g. Desert Safari"
                  maxLength={100}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Category
                </span>
                <select
                  {...field("category")}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 lg:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Image URL *
                </span>
                <input
                  {...field("imageUrl")}
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Cost *
                </span>
                <input
                  {...field("cost")}
                  placeholder="e.g. PKR 5,000"
                  maxLength={40}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5 lg:col-span-3">
                <span className="text-xs font-semibold text-slate-600">
                  Description
                </span>
                <textarea
                  {...field("description")}
                  placeholder="Describe this activity..."
                  maxLength={500}
                  rows={3}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Rating
                </span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  {...field("reviews")}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Review Count
                </span>
                <input
                  type="number"
                  min={0}
                  {...field("reviewCount")}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Sort Order
                </span>
                <input
                  type="number"
                  min={0}
                  {...field("sortOrder")}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">
                  Active (visible on homepage)
                </span>
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editingId === "new"
                    ? "Add Activity"
                    : "Save Changes"}
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading activities…</p>
          ) : activities.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No activities yet. Add one above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
              <tbody className="divide-y divide-slate-100">
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="bg-white transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {activity.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {destinationName(activity.destinationId)}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {activity.category.replace("-", " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {activity.cost}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {activity.reviews.toFixed(1)} ⭐ ({activity.reviewCount})
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          activity.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {activity.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(activity)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(activity.id, activity.title)
                          }
                          className="flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
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
          <p className="mt-3 text-xs text-amber-600">
            ⚠ Showing dummy data — write operations are currently unavailable.
            Confirm your database server is running and that{" "}
            <code className="rounded bg-amber-50 px-1">DATABASE_URL</code> is
            set and{" "}
            <code className="rounded bg-amber-50 px-1">
              npm run prisma:migrate
            </code>{" "}
            is run.
          </p>
        )}
      </div>
    </main>
  );
}
