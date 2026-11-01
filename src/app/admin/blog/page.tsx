"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X, Eye, EyeOff } from "lucide-react";
import { blogPostSchema } from "@/lib/validations/blog";
import { useBrand } from "@/components/shared/brand-provider";
import { MediaUrlInput } from "@/components/admin/media-picker";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  author: string;
  category: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  sortOrder: number;
};

const CATEGORY_OPTIONS = [
  { value: "travel", label: "Travel" },
  { value: "umrah", label: "Umrah" },
  { value: "flights", label: "Flights" },
  { value: "hotels", label: "Hotels" },
  { value: "destinations", label: "Destinations" },
  { value: "tips", label: "Tips" },
  { value: "news", label: "News" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-line/50 text-muted",
  PUBLISHED: "bg-success/12 text-success",
  ARCHIVED: "bg-gold/15 text-gold-strong",
};

const EMPTY_FORM = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  author: "",
  category: "travel",
  tags: "",
  status: "DRAFT",
  sortOrder: "0",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminBlogPage() {
  const brand = useBrand();
  const emptyForm = { ...EMPTY_FORM, author: `${brand.name} Travel Team` };
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/blog?all=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load blog posts.");
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openNew = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (post: BlogPost) => {
    setFormData({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      author: post.author,
      category: post.category,
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      status: post.status,
      sortOrder: String(post.sortOrder),
    });
    setEditingId(post.id);
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError("");
  };

  const handleTitleChange = (title: string) => {
    setFormData((f) => ({
      ...f,
      title,
      slug: editingId ? f.slug : slugify(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      sortOrder: Number(formData.sortOrder),
    };

    const result = blogPostSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Validation error");
      setSaving(false);
      return;
    }

    try {
      const url = editingId ? `/api/blog/${editingId}` : "/api/blog";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }

      await fetchPosts();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/blog/${id}`, { method: "DELETE" });
      await fetchPosts();
    } catch {
      setError("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    const next =
      post.status === "PUBLISHED"
        ? "DRAFT"
        : post.status === "DRAFT"
          ? "PUBLISHED"
          : post.status;
    try {
      await fetch(`/api/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      await fetchPosts();
    } catch {
      setError("Status update failed.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-navy">
              Blog Management
            </h1>
            <p className="mt-2 text-sm text-muted">
              Manage editorial content displayed in the homepage blog section.
            </p>
          </div>
          <button
            onClick={openNew}
            className="btn btn-primary flex shrink-0 items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New post
          </button>
        </div>

        {error && !showForm && (
          <p className="mb-4 rounded-xl bg-deal/6 px-4 py-3 text-sm text-deal">
            {error}
          </p>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-line bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy">
                {editingId ? "Edit Post" : "Create Post"}
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

            <form onSubmit={handleSubmit} className="grid gap-4">
              {/* Title + auto-slug */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Title *
                  </label>
                  <input
                    className="input input-bordered input-sm"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    placeholder="Headline of the post"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Slug *
                  </label>
                  <input
                    className="input input-bordered input-sm font-mono"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, slug: e.target.value }))
                    }
                    required
                    placeholder="url-friendly-slug"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Excerpt *
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-sm h-16 resize-none"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, excerpt: e.target.value }))
                  }
                  required
                  placeholder="Short summary shown on the slider card (max 500 chars)"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Content *{" "}
                  <span className="font-normal normal-case text-muted/70">
                    (HTML or plain text)
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-sm h-40 resize-y font-mono text-xs"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, content: e.target.value }))
                  }
                  required
                  placeholder="<p>Full article content…</p>"
                />
              </div>

              {/* Cover image */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Cover image *
                </span>
                <MediaUrlInput
                  value={formData.coverImageUrl}
                  onChange={(url) =>
                    setFormData((f) => ({ ...f, coverImageUrl: url }))
                  }
                  folder="blog-media"
                  required
                  type="url"
                  placeholder="Choose from the library or paste a URL"
                  inputClassName="input input-bordered input-sm"
                />
              </div>

              {/* Author / Category / Status / Sort */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Author
                  </label>
                  <input
                    className="input input-bordered input-sm"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, author: e.target.value }))
                    }
                    placeholder={`${brand.name} Travel Team`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Category
                  </label>
                  <select
                    className="select select-bordered select-sm"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, category: e.target.value }))
                    }
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Status
                  </label>
                  <select
                    className="select select-bordered select-sm"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Sort order
                  </label>
                  <input
                    className="input input-bordered input-sm"
                    type="number"
                    min={0}
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, sortOrder: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Tags{" "}
                  <span className="font-normal normal-case text-muted/70">
                    (comma-separated)
                  </span>
                </label>
                <input
                  className="input input-bordered input-sm"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, tags: e.target.value }))
                  }
                  placeholder="umrah, tips, first-time"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-sm"
                >
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Create post"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts list */}
        {loading ? (
          <p className="text-sm text-muted">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted">
            No posts yet.{" "}
            <button
              onClick={openNew}
              className="font-semibold text-brand hover:underline"
            >
              Create the first one.
            </button>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-4"
              >
                {/* Thumbnail */}
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[post.status] ?? STATUS_COLORS.DRAFT}`}
                    >
                      {post.status}
                    </span>
                    <span className="text-xs text-muted/70">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted/70">
                      Sort: {post.sortOrder}
                    </span>
                  </div>
                  <p className="font-semibold text-navy">{post.title}</p>
                  <p className="line-clamp-1 text-xs text-muted">
                    /{post.slug}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleStatus(post)}
                    title={
                      post.status === "PUBLISHED" ? "Unpublish" : "Publish"
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted/70 hover:bg-line/50 hover:text-navy/80"
                    disabled={post.status === "ARCHIVED"}
                  >
                    {post.status === "PUBLISHED" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted/70 hover:bg-line/50 hover:text-navy/80"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    title="Delete"
                    disabled={deletingId === post.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted/70 hover:bg-deal/6 hover:text-deal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
