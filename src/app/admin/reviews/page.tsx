"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Star, X } from "lucide-react";
import type { CustomerReviewRow } from "@/app/api/reviews/route";

const TRIP_TYPES = [
  "Umrah",
  "Family",
  "Business",
  "Honeymoon",
  "Solo",
  "Group",
  "Other",
];

const EMPTY_FORM = {
  customerName: "",
  location: "",
  rating: "5",
  title: "",
  body: "",
  tripType: "",
  isVerified: false,
  isPublished: false,
  sortOrder: "0",
};

type FormState = typeof EMPTY_FORM;

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
          aria-label={`${star} star`}
        >
          <Star
            className={`h-5 w-5 transition ${
              star <= (hovered || value)
                ? "fill-gold text-gold"
                : "text-muted/50"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < rating ? "fill-gold text-gold" : "text-white/85"
          }`}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<CustomerReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDummy, setIsDummy] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews?all=true");
      setIsDummy(res.headers.get("x-review-source") === "dummy");
      const data = (await res.json()) as CustomerReviewRow[];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, []);

  function openNew() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError("");
    setShowForm(true);
    setTimeout(
      () => formRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  function openEdit(review: CustomerReviewRow) {
    setEditingId(review.id);
    setFormData({
      customerName: review.customerName,
      location: review.location ?? "",
      rating: String(review.rating),
      title: review.title,
      body: review.body,
      tripType: review.tripType ?? "",
      isVerified: review.isVerified,
      isPublished: review.isPublished,
      sortOrder: String(review.sortOrder),
    });
    setError("");
    setShowForm(true);
    setTimeout(
      () => formRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  function field(
    key: keyof Pick<
      FormState,
      "customerName" | "location" | "title" | "body" | "sortOrder"
    >,
  ) {
    return {
      value: formData[key] as string,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => setFormData((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!formData.title.trim()) {
      setError("Review title is required.");
      return;
    }
    if (!formData.body.trim()) {
      setError("Review body is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerName: formData.customerName.trim(),
        location: formData.location.trim() || null,
        rating: Number(formData.rating),
        title: formData.title.trim(),
        body: formData.body.trim(),
        tripType: formData.tripType || null,
        isVerified: formData.isVerified,
        isPublished: formData.isPublished,
        sortOrder: Number(formData.sortOrder) || 0,
      };

      const url = editingId ? `/api/reviews/${editingId}` : "/api/reviews";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to save review");
      }

      await fetchReviews();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    try {
      await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      await fetchReviews();
    } catch {
      setError("Failed to delete review.");
    }
  }

  async function togglePublished(review: CustomerReviewRow) {
    try {
      await fetch(`/api/reviews/${review.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !review.isPublished }),
      });
      await fetchReviews();
    } catch {
      setError("Failed to update review status.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-navy">
            Customer Reviews
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage customer testimonials published across the storefront.
            {isDummy && (
              <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold-strong">
                Sample data · add your first review below
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </button>
      </div>

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div
          ref={formRef}
          className="rounded-2xl border border-line bg-white p-6 shadow-card"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">
              {editingId ? "Edit Review" : "Add New Review"}
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

          <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
            {/* Row 1: name + location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Customer Name *
                </span>
                <input
                  {...field("customerName")}
                  placeholder="e.g. Ahmed Al-Rashdi"
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Location
                </span>
                <input
                  {...field("location")}
                  placeholder="e.g. Karachi, Pakistan"
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>
            </div>

            {/* Row 2: trip type + rating + sort order */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Trip Type
                </span>
                <select
                  value={formData.tripType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tripType: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="">— Select —</option>
                  {TRIP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Rating *
                </span>
                <div className="flex h-9 items-center">
                  <StarRatingInput
                    value={Number(formData.rating)}
                    onChange={(v) =>
                      setFormData((prev) => ({ ...prev, rating: String(v) }))
                    }
                  />
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Sort Order
                </span>
                <input
                  type="number"
                  min={0}
                  {...field("sortOrder")}
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>
            </div>

            {/* Title */}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Review Title *
              </span>
              <input
                {...field("title")}
                placeholder="e.g. Outstanding Umrah experience — exceeded every expectation"
                className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>

            {/* Body */}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Review Body *
              </span>
              <textarea
                {...field("body")}
                rows={4}
                placeholder="Full review text from the customer..."
                className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isVerified: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-line-strong accent-brand"
                />
                <span className="text-sm font-medium text-navy/80">
                  Verified Customer
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isPublished: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-line-strong accent-brand"
                />
                <span className="text-sm font-medium text-navy/80">
                  Published
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-line pt-4">
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
                  : editingId
                    ? "Update Review"
                    : "Add Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Reviews table ── */}
      <section className="rounded-2xl border border-line bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold text-navy">
            All Reviews{" "}
            <span className="ml-1.5 rounded-full bg-line/50 px-2 py-0.5 text-xs font-medium text-muted">
              {reviews.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-muted/70">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted/70">
            No reviews yet. Add your first one above.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_auto]"
              >
                {/* Content */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <RatingBadge rating={review.rating} />
                    {review.tripType && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                        {review.tripType}
                      </span>
                    )}
                    {review.isVerified && (
                      <span className="rounded-full bg-success/8 px-2 py-0.5 text-xs font-medium text-success">
                        ✓ Verified
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        review.isPublished
                          ? "bg-success/8 text-success"
                          : "bg-line/50 text-muted"
                      }`}
                    >
                      {review.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-navy">
                    {review.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                    {review.body}
                  </p>
                  <p className="mt-1.5 text-xs text-muted/70">
                    {review.customerName}
                    {review.location ? ` · ${review.location}` : ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-start gap-2">
                  <button
                    onClick={() => void togglePublished(review)}
                    className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-subtle"
                  >
                    {review.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => openEdit(review)}
                    className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-subtle"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(review.id)}
                    className="rounded-lg border border-deal/20 px-2.5 py-1.5 text-xs font-medium text-deal transition hover:bg-deal/6"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
