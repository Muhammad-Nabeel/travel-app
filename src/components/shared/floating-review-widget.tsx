"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Star, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { ChatbotWidget } from "@/components/shared/chatbot-widget";

const TRIP_TYPES = [
  "Umrah",
  "Family",
  "Business",
  "Honeymoon",
  "Solo",
  "Group",
  "Other",
];

export function FloatingReviewWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    location: "",
    rating: "5",
    title: "",
    body: "",
    tripType: "",
  });

  const hidden = useMemo(() => {
    return (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/signin") ||
      pathname.startsWith("/signup")
    );
  }, [pathname]);

  if (hidden) {
    return null;
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.customerName.trim() || !form.title.trim() || !form.body.trim()) {
      setError("Please complete name, title, and review details.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          location: form.location.trim() || null,
          rating: Number(form.rating),
          title: form.title.trim(),
          body: form.body.trim(),
          tripType: form.tripType || null,
          isPublished: false,
          isVerified: false,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to submit review.");
      }

      setMessage("Thank you. Your review has been submitted for approval.");
      setForm({
        customerName: "",
        location: "",
        rating: "5",
        title: "",
        body: "",
        tripType: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-blue-600 p-3 text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Write a review"
          title="Write a review"
        >
          <Star className="h-5 w-5" />
        </button>

        <a
          href="https://wa.me/447933837137"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#25D366] p-3 text-white shadow-lg transition hover:bg-[#1daa56] focus:outline-none focus:ring-2 focus:ring-[#7fe5aa]"
          aria-label="Open WhatsApp chat"
          title="WhatsApp chat"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>

        <ChatbotWidget />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Close review form"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Customer Feedback
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Share your review
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your feedback helps other travelers make better decisions.
            </p>

            <form
              onSubmit={(e) => void submitReview(e)}
              className="mt-4 grid gap-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Your Name *
                  </span>
                  <input
                    value={form.customerName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Location
                  </span>
                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Trip Type
                  </span>
                  <select
                    value={form.tripType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tripType: e.target.value }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    {TRIP_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Rating *
                  </span>
                  <div className="flex h-10 items-center rounded-lg border border-slate-300 px-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              rating: String(star),
                            }))
                          }
                          className="focus:outline-none"
                          aria-label={`${star} star`}
                        >
                          <Star
                            className={`h-4 w-4 ${star <= Number(form.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Review Title *
                </span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Your Review *
                </span>
                <textarea
                  rows={4}
                  value={form.body}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, body: e.target.value }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>

              {message && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
