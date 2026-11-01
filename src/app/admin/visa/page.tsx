"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import {
  EMPTY_SEO_DRAFT,
  SeoFields,
  resolveSeoDraft,
  seoDraftFrom,
  seoTitleBudgetIssue,
  type SeoDraft,
} from "@/components/admin/seo-fields";
import { useBrand } from "@/components/shared/brand-provider";
import type {
  VisaCountryEntry,
  VisaType,
} from "@/lib/admin-settings/visa-settings";
import { suggestVisaSeo } from "@/lib/seo-suggestions";
import { getVisaPath } from "@/lib/visa";

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
  seoTitle: "",
  seoDescription: "",
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
  const [seoDrafts, setSeoDrafts] = useState<SeoDraft[]>([]);
  const brand = useBrand();

  const loadEntries = (items: VisaCountryEntry[]) => {
    setEntries(items);
    setSeoDrafts(
      items.map((item) => seoDraftFrom(item, suggestVisaSeo(item, brand.name))),
    );
  };
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
        loadEntries(Array.isArray(data) ? data : []);
      } catch {
        setError("Unable to load visa countries.");
      } finally {
        setLoading(false);
      }
    };

    void fetchEntries();
    // Loads once; the brand only shapes the initial SEO suggestions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const payload = entries.map((entry, index) => ({
      ...entry,
      ...resolveSeoDraft(
        seoDrafts[index] ?? EMPTY_SEO_DRAFT,
        suggestVisaSeo(entry, brand.name),
      ),
    }));
    for (const entry of payload) {
      const titleIssue = seoTitleBudgetIssue(entry.seoTitle, brand.name);
      if (titleIssue) {
        setError(`${entry.country || "New country"}: ${titleIssue}`);
        setSaving(false);
        return;
      }
    }
    try {
      const res = await fetch("/api/admin/settings/visa-countries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error || "Unable to save visa countries.");
      }

      const saved = (await res.json()) as VisaCountryEntry[];
      loadEntries(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    setEntries((prev) => [...prev, { ...EMPTY_ENTRY }]);
    setSeoDrafts((prev) => [...prev, EMPTY_SEO_DRAFT]);
  };

  const handleRemove = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
    setSeoDrafts((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="section-shell py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Visa Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy">
            Visa countries & pricing
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage visa types and pricing for each destination. Active items are
            shown on the visa search page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-navy/80 transition hover:border-line-strong"
          >
            <Plus className="h-4 w-4" />
            Add country
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-deal/20 bg-deal/6 px-4 py-3 text-sm text-deal">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
          Loading visa countries...
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-muted">
          No visa countries yet. Add your first country.
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry, index) => (
            <section
              key={`${entry.country}-${index}`}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-navy">
                  {entry.country || "New country"}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="inline-flex items-center gap-2 rounded-lg border border-deal/20 px-3 py-1.5 text-xs font-semibold text-deal transition hover:bg-deal/6"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Country
                  </span>
                  <input
                    value={entry.country}
                    onChange={(event) =>
                      updateEntry(index, "country", event.target.value)
                    }
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  >
                    {VISA_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Country code
                  </span>
                  <input
                    value={entry.code}
                    onChange={(event) =>
                      updateEntry(index, "code", event.target.value)
                    }
                    placeholder="MY"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm uppercase outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Duration
                  </span>
                  <input
                    value={entry.duration}
                    onChange={(event) =>
                      updateEntry(index, "duration", event.target.value)
                    }
                    placeholder="30 days"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Entry type
                  </span>
                  <input
                    value={entry.entry}
                    onChange={(event) =>
                      updateEntry(index, "entry", event.target.value)
                    }
                    placeholder="Single Entry"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Per person cost
                  </span>
                  <input
                    value={entry.perPersonCost}
                    onChange={(event) =>
                      updateEntry(index, "perPersonCost", event.target.value)
                    }
                    placeholder="PKR 30,000 / Traveler"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Service fee
                  </span>
                  <input
                    value={entry.serviceFee}
                    onChange={(event) =>
                      updateEntry(index, "serviceFee", event.target.value)
                    }
                    placeholder="PKR 10,000"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Net cost
                  </span>
                  <input
                    value={entry.netCost}
                    onChange={(event) =>
                      updateEntry(index, "netCost", event.target.value)
                    }
                    placeholder="PKR 40,000"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={entry.isActive}
                    onChange={(event) =>
                      updateEntry(index, "isActive", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                  />
                  Active
                </label>
              </div>

              <div className="mt-4">
                <SeoFields
                  draft={seoDrafts[index] ?? EMPTY_SEO_DRAFT}
                  suggestion={suggestVisaSeo(entry, brand.name)}
                  onChange={(draft) =>
                    setSeoDrafts((prev) =>
                      prev.map((item, idx) => (idx === index ? draft : item)),
                    )
                  }
                  path={getVisaPath(entry.country, entry.visaType)}
                />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
