"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import type {
  VisaCountryEntry,
  VisaType,
} from "@/lib/admin-settings/visa-settings";

const EMPTY_ENTRY: VisaCountryEntry = {
  country: "",
  visaType: "e-visa",
  duration: "",
  entry: "",
  perPersonCost: "",
  serviceFee: "",
  netCost: "",
  code: "",
  isActive: true,
  sortOrder: 0,
};

const VISA_TYPES: { value: VisaType; label: string }[] = [
  { value: "e-visa", label: "e-Visa" },
  { value: "sticker-visa", label: "Sticker Visa" },
];

function parseMoney(value: string): number | null {
  const cleaned = value.replace(/,/g, "");
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function findPricingIssue(entries: VisaCountryEntry[]): string | null {
  for (const entry of entries) {
    const perPerson = parseMoney(entry.perPersonCost);
    const serviceFee = parseMoney(entry.serviceFee);
    const netCost = parseMoney(entry.netCost);

    if (perPerson === null || serviceFee === null || netCost === null) {
      continue;
    }

    if (netCost < perPerson + serviceFee) {
      return `Net cost must be at least per person + service fee for ${
        entry.country || "this entry"
      }.`;
    }
  }

  return null;
}

export default function AdminVisaPage() {
  const [entries, setEntries] = useState<VisaCountryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch("/api/admin/settings/visa-countries", {
          cache: "no-store",
        });
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);
      } catch {
        setError("Unable to load visa countries.");
      } finally {
        setLoading(false);
      }
    };

    void fetchEntries();
  }, []);

  const updateEntry = <K extends keyof VisaCountryEntry>(
    index: number,
    key: K,
    value: VisaCountryEntry[K],
  ) => {
    setEntries((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const pricingIssue = findPricingIssue(entries);
    if (pricingIssue) {
      setError(pricingIssue);
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/settings/visa-countries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error || "Unable to save visa countries.");
      }

      const saved = (await res.json()) as VisaCountryEntry[];
      setEntries(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    setEntries((prev) => [...prev, { ...EMPTY_ENTRY }]);
  };

  const handleRemove = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="section-shell py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Visa Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Visa countries & pricing
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage visa types and pricing for each destination. Active items are
            shown on the visa search page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            <Plus className="h-4 w-4" />
            Add country
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading visa countries...
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          No visa countries yet. Add your first country.
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry, index) => (
            <section
              key={`${entry.country}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  {entry.country || "New country"}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Country
                  </span>
                  <input
                    value={entry.country}
                    onChange={(event) =>
                      updateEntry(index, "country", event.target.value)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Visa type
                  </span>
                  <select
                    value={entry.visaType}
                    onChange={(event) =>
                      updateEntry(
                        index,
                        "visaType",
                        event.target.value as VisaType,
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  >
                    {VISA_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Country code
                  </span>
                  <input
                    value={entry.code}
                    onChange={(event) =>
                      updateEntry(index, "code", event.target.value)
                    }
                    placeholder="MY"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Duration
                  </span>
                  <input
                    value={entry.duration}
                    onChange={(event) =>
                      updateEntry(index, "duration", event.target.value)
                    }
                    placeholder="30 days"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Entry type
                  </span>
                  <input
                    value={entry.entry}
                    onChange={(event) =>
                      updateEntry(index, "entry", event.target.value)
                    }
                    placeholder="Single Entry"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Per person cost
                  </span>
                  <input
                    value={entry.perPersonCost}
                    onChange={(event) =>
                      updateEntry(index, "perPersonCost", event.target.value)
                    }
                    placeholder="PKR 30,000 / Traveler"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Service fee
                  </span>
                  <input
                    value={entry.serviceFee}
                    onChange={(event) =>
                      updateEntry(index, "serviceFee", event.target.value)
                    }
                    placeholder="PKR 10,000"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Net cost
                  </span>
                  <input
                    value={entry.netCost}
                    onChange={(event) =>
                      updateEntry(index, "netCost", event.target.value)
                    }
                    placeholder="PKR 40,000"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Sort order
                  </span>
                  <input
                    type="number"
                    value={entry.sortOrder}
                    onChange={(event) =>
                      updateEntry(
                        index,
                        "sortOrder",
                        Number(event.target.value),
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={entry.isActive}
                    onChange={(event) =>
                      updateEntry(index, "isActive", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Active
                </label>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
