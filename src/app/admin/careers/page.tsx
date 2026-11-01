"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { JobOpeningRow } from "@/lib/job-openings";

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
];

const EMPTY_FORM = {
  title: "",
  team: "",
  location: "",
  employmentType: "Full-time",
  summary: "",
  isActive: true,
  sortOrder: "0",
};

type FormState = typeof EMPTY_FORM;

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export default function AdminCareersPage() {
  const [jobs, setJobs] = useState<JobOpeningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/job-openings", { cache: "no-store" });
      const data = (await res.json()) as {
        jobOpenings?: JobOpeningRow[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not load job openings.");
      }
      setJobs(data.jobOpenings ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load job openings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, []);

  function scrollToForm() {
    setTimeout(
      () => formRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  function openNew() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError("");
    setShowForm(true);
    scrollToForm();
  }

  function openEdit(job: JobOpeningRow) {
    setEditingId(job.id);
    setFormData({
      title: job.title,
      team: job.team,
      location: job.location,
      employmentType: job.employmentType,
      summary: job.summary,
      isActive: job.isActive,
      sortOrder: String(job.sortOrder),
    });
    setError("");
    setShowForm(true);
    scrollToForm();
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  function field(
    key: keyof Pick<
      FormState,
      "title" | "team" | "location" | "summary" | "sortOrder"
    >,
  ) {
    return {
      value: formData[key],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => setFormData((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  async function saveJob(id: string | null, payload: object) {
    const res = await fetch(
      id ? `/api/admin/job-openings/${id}` : "/api/admin/job-openings",
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      throw new Error(err.error ?? "Failed to save job opening");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      title: formData.title.trim(),
      team: formData.team.trim(),
      location: formData.location.trim(),
      employmentType: formData.employmentType,
      summary: formData.summary.trim(),
      isActive: formData.isActive,
      sortOrder: Number(formData.sortOrder) || 0,
    };

    if (
      !payload.title ||
      !payload.team ||
      !payload.location ||
      !payload.employmentType ||
      !payload.summary
    ) {
      setError(
        "Title, team, location, employment type and summary are required.",
      );
      return;
    }

    setSaving(true);
    try {
      await saveJob(editingId, payload);
      await fetchJobs();
      closeForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save job opening",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this job opening? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/job-openings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      await fetchJobs();
    } catch {
      setError("Failed to delete job opening.");
    }
  }

  async function toggleActive(job: JobOpeningRow) {
    try {
      await saveJob(job.id, { ...job, isActive: !job.isActive });
      await fetchJobs();
    } catch {
      setError("Failed to update job opening status.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-navy">Careers</h1>
          <p className="mt-1 text-sm text-muted">
            Open roles listed on the careers page. Page text and the application
            email are under{" "}
            <Link
              href="/admin/site-pages"
              className="font-medium text-brand hover:underline"
            >
              Site Pages → Careers
            </Link>
            .
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          <Plus className="h-4 w-4" />
          Add Job Opening
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
              {editingId ? "Edit Job Opening" : "Add Job Opening"}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Job Title *
                </span>
                <input
                  {...field("title")}
                  placeholder="e.g. Travel Consultant"
                  className={INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Team *
                </span>
                <input
                  {...field("team")}
                  placeholder="e.g. Customer Success"
                  className={INPUT_CLASS}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Location *
                </span>
                <input
                  {...field("location")}
                  placeholder="e.g. Lahore, PK"
                  className={INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Employment Type *
                </span>
                <select
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employmentType: e.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Sort Order
                </span>
                <input
                  type="number"
                  min={0}
                  {...field("sortOrder")}
                  className={INPUT_CLASS}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Summary *
              </span>
              <textarea
                {...field("summary")}
                rows={4}
                placeholder="What the role involves and who it suits."
                className={INPUT_CLASS}
              />
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
                Show on careers page
              </span>
            </label>

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
                    ? "Update Job Opening"
                    : "Add Job Opening"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Job openings list ── */}
      <section className="rounded-2xl border border-line bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold text-navy">
            All Job Openings{" "}
            <span className="ml-1.5 rounded-full bg-line/50 px-2 py-0.5 text-xs font-medium text-muted">
              {jobs.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-muted/70">
            Loading job openings…
          </p>
        ) : jobs.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted/70">
            No job openings yet. The open roles section stays hidden on the
            careers page until you add one.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                      {job.team}
                    </span>
                    <span className="rounded-full bg-line/50 px-2 py-0.5 text-xs font-medium text-muted">
                      {job.location}
                    </span>
                    <span className="rounded-full bg-line/50 px-2 py-0.5 text-xs font-medium text-muted">
                      {job.employmentType}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        job.isActive
                          ? "bg-success/8 text-success"
                          : "bg-line/50 text-muted"
                      }`}
                    >
                      {job.isActive ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-navy">
                    {job.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                    {job.summary}
                  </p>
                </div>

                <div className="flex shrink-0 items-start gap-2">
                  <button
                    onClick={() => void toggleActive(job)}
                    className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-subtle"
                  >
                    {job.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => openEdit(job)}
                    className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-subtle"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(job.id)}
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
