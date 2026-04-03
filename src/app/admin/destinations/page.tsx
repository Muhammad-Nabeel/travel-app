"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import { ZodError } from "zod";
import { destinationSchema } from "@/lib/validations/destination";

type Destination = {
  id: string;
  city: string;
  country: string;
  iataCode: string | null;
  imageUrl: string | null;
  fare: string;
  notes: string | null;
  gradient: string;
  sortOrder: number;
  isActive: boolean;
};

type CitySuggestion = {
  city: string;
  country: string;
  iata: string;
};

const GRADIENT_OPTIONS = [
  { value: "blue", label: "Blue" },
  { value: "dark", label: "Dark" },
  { value: "ocean", label: "Ocean" },
  { value: "purple", label: "Purple" },
  { value: "teal", label: "Teal" },
  { value: "sunset", label: "Sunset" },
  { value: "navy", label: "Navy" },
];

const GRADIENT_PREVIEW: Record<string, string> = {
  blue: "linear-gradient(130deg, #274c77 0%, #6096ba 45%, #a3cef1 100%)",
  dark: "linear-gradient(130deg, #2b2d42 0%, #8d99ae 45%, #edf2f4 100%)",
  ocean: "linear-gradient(130deg, #003049 0%, #669bbc 45%, #eae2b7 100%)",
  purple: "linear-gradient(130deg, #4a4e69 0%, #9a8c98 45%, #c9ada7 100%)",
  teal: "linear-gradient(130deg, #005f73 0%, #0a9396 45%, #94d2bd 100%)",
  sunset: "linear-gradient(130deg, #9d0208 0%, #dc2f02 45%, #f48c06 100%)",
  navy: "linear-gradient(130deg, #14213d 0%, #3a506b 45%, #5bc0be 100%)",
};

const EMPTY_FORM = {
  city: "",
  country: "",
  iataCode: "",
  imageUrl: "",
  fare: "",
  notes: "",
  gradient: "blue",
  sortOrder: "0",
  isActive: true,
};

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isDummyMode, setIsDummyMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [cityLookupLoading, setCityLookupLoading] = useState(false);
  const cityFieldRef = useRef<HTMLLabelElement>(null);
  const citySearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDestinations = async () => {
    try {
      const res = await fetch("/api/destinations?all=true");
      setIsDummyMode(res.headers.get("x-destination-source") === "dummy");
      const data = await res.json();
      setDestinations(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load destinations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        cityFieldRef.current &&
        !cityFieldRef.current.contains(e.target as Node)
      ) {
        setShowCitySuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      if (citySearchTimerRef.current) {
        clearTimeout(citySearchTimerRef.current);
      }
    };
  }, []);

  const startEdit = (d: Destination) => {
    setEditingId(d.id);
    setFormData({
      city: d.city,
      country: d.country,
      iataCode: d.iataCode ?? "",
      imageUrl: d.imageUrl ?? "",
      fare: d.fare,
      notes: d.notes ?? "",
      gradient: d.gradient,
      sortOrder: String(d.sortOrder),
      isActive: d.isActive,
    });
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setCityLookupLoading(false);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setCityLookupLoading(false);
    setError("");
  };

  const handleCityInputChange = (raw: string) => {
    setFormData((prev) => ({ ...prev, city: raw }));

    if (citySearchTimerRef.current) {
      clearTimeout(citySearchTimerRef.current);
    }

    const trimmed = raw.trim();

    if (trimmed.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setCityLookupLoading(false);
      return;
    }

    setCityLookupLoading(true);
    setShowCitySuggestions(true);

    citySearchTimerRef.current = setTimeout(() => {
      void fetch(`/api/places/cities?query=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((json: { results?: CitySuggestion[] }) => {
          setCitySuggestions(json.results ?? []);
          setShowCitySuggestions((json.results?.length ?? 0) > 0);
          setCityLookupLoading(false);
        })
        .catch(() => {
          setCitySuggestions([]);
          setShowCitySuggestions(false);
          setCityLookupLoading(false);
        });
    }, 260);
  };

  const handleCitySuggestionSelect = (item: CitySuggestion) => {
    setFormData((prev) => ({
      ...prev,
      city: item.city,
      country: item.country,
      iataCode: item.iata,
    }));
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setCityLookupLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      // Validate form data with Zod schema
      const validatedData = destinationSchema.parse({
        city: formData.city,
        country: formData.country,
        iataCode: formData.iataCode,
        imageUrl: formData.imageUrl,
        fare: formData.fare,
        notes: formData.notes,
        gradient: formData.gradient,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      });

      const url =
        editingId && editingId !== "new"
          ? `/api/destinations/${editingId}`
          : "/api/destinations";
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
            `Failed to ${editingId && editingId !== "new" ? "update" : "add"} destination. ${res.status}`,
        );
      } else {
        cancelEdit();
        await fetchDestinations();
      }
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        // Zod validation error on client
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

  const handleDelete = async (id: string, city: string) => {
    if (!window.confirm(`Delete "${city}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to delete.");
      } else {
        await fetchDestinations();
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
        <span className="text-sm font-semibold text-slate-900">
          Destinations
        </span>
      </div>

      <div className="surface ring-soft rounded-4xl border border-white/80 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">
              Administration
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-brand-strong">
              Destination Management
            </h1>
            <p className="mt-2 text-sm text-muted">
              Manage the destination content featured throughout the public
              experience.
            </p>
          </div>
          {editingId === null && (
            <button
              onClick={() => {
                setEditingId("new");
                setFormData(EMPTY_FORM);
                setCitySuggestions([]);
                setShowCitySuggestions(false);
                setCityLookupLoading(false);
              }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              Add Destination
            </button>
          )}
        </div>

        {/* Form */}
        {editingId !== null && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {editingId === "new" ? "New destination" : "Edit destination"}
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
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  City *
                </span>
                <label className="relative" ref={cityFieldRef}>
                  <input
                    value={formData.city}
                    onFocus={() => {
                      if (citySuggestions.length > 0) {
                        setShowCitySuggestions(true);
                      }
                    }}
                    onChange={(e) => handleCityInputChange(e.target.value)}
                    placeholder="e.g. Dubai"
                    maxLength={80}
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />

                  {showCitySuggestions &&
                    (cityLookupLoading || citySuggestions.length > 0) && (
                      <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
                        {cityLookupLoading ? (
                          <p className="px-2 py-2 text-xs text-slate-500">
                            Searching cities...
                          </p>
                        ) : (
                          citySuggestions.map((item) => (
                            <button
                              key={`${item.city}-${item.country}-${item.iata}`}
                              type="button"
                              onClick={() => handleCitySuggestionSelect(item)}
                              className="w-full rounded-md px-2 py-1.5 text-left hover:bg-slate-50"
                            >
                              <p className="text-sm font-semibold text-slate-800">
                                {item.city}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.country} - {item.iata}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Country *
                </span>
                <input
                  {...field("country")}
                  placeholder="e.g. UAE"
                  maxLength={80}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  IATA Code
                </span>
                <input
                  {...field("iataCode")}
                  placeholder="e.g. DXB"
                  maxLength={4}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Fare *
                </span>
                <input
                  {...field("fare")}
                  placeholder="e.g. PKR 38,400"
                  maxLength={40}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Notes
                </span>
                <input
                  {...field("notes")}
                  placeholder="e.g. Round-trip flights"
                  maxLength={120}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1.5 lg:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Image URL
                </span>
                <input
                  {...field("imageUrl")}
                  placeholder="/destinations/dubai.jpg or https://..."
                  maxLength={500}
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
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Card Gradient
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="h-7 w-10 shrink-0 rounded-md"
                    style={{
                      background:
                        GRADIENT_PREVIEW[formData.gradient] ??
                        GRADIENT_PREVIEW.blue,
                    }}
                  />
                  <select
                    {...field("gradient")}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  >
                    {GRADIENT_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                    ? "Add Destination"
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
            <p className="p-6 text-sm text-slate-500">Loading destinations…</p>
          ) : destinations.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No destinations yet. Add one above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">IATA</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Gradient</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {destinations.map((d) => (
                  <tr
                    key={d.id}
                    className="bg-white transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {d.city}
                    </td>
                    <td className="px-4 py-3">
                      {d.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.imageUrl}
                          alt={`${d.city} preview`}
                          className="h-10 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.country}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {d.iataCode ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.fare}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-8 rounded"
                          style={{
                            background:
                              GRADIENT_PREVIEW[d.gradient] ??
                              GRADIENT_PREVIEW.blue,
                          }}
                        />
                        <span className="capitalize text-slate-500">
                          {d.gradient}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          d.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {d.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(d)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.city)}
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

        {!loading && isDummyMode && (
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
