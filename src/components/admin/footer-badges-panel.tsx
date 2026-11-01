"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";

import { MediaPickerDialog } from "@/components/admin/media-picker";
import type { FooterBadge } from "@/lib/brand-assets";

const BRAND_ENDPOINT = "/api/admin/settings/brand";

async function readBadges(res: Response): Promise<FooterBadge[]> {
  const json = (await res.json()) as {
    footerBadges?: FooterBadge[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? "Request failed.");
  }
  return json.footerBadges ?? [];
}

/**
 * Payment and accreditation badges in the footer badge row. Images come from
 * the media library; each needs a label, which becomes its alt text.
 */
export function FooterBadgesPanel() {
  const [badges, setBadges] = useState<FooterBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(BRAND_ENDPOINT, { cache: "no-store" })
      .then(readBadges)
      .then((loaded) => {
        if (!ignore) setBadges(loaded);
      })
      .catch((err: unknown) => {
        if (!ignore)
          setError(
            err instanceof Error ? err.message : "Unable to load badges.",
          );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  function updateLabel(index: number, label: string) {
    setBadges((current) =>
      current.map((badge, i) => (i === index ? { ...badge, label } : badge)),
    );
  }

  function move(index: number, offset: -1 | 1) {
    setBadges((current) => {
      const next = [...current];
      const [badge] = next.splice(index, 1);
      next.splice(index + offset, 0, badge);
      return next;
    });
  }

  function remove(index: number) {
    setBadges((current) => current.filter((_, i) => i !== index));
  }

  async function save() {
    setMessage("");
    setError("");
    if (badges.some((badge) => !badge.label.trim())) {
      setError("Every badge needs a label.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(BRAND_ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ footerBadges: badges }),
      });
      setBadges(await readBadges(res));
      setMessage("Footer badges saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save badges.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted/70" />
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-navy">Footer badges</h3>
          <p className="mt-1 text-xs text-muted">
            Payment and accreditation badges shown in a row above the footer
            bottom bar, in this order. The label is the badge&apos;s alt text.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-navy/80 hover:border-brand hover:text-brand-strong disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            Add badge
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save badges
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-success/25 bg-success/8 p-3 text-sm text-success">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-deal/20 bg-deal/6 p-3 text-sm text-deal">
          {error}
        </div>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) =>
          setBadges((current) => [...current, { url, label: "" }])
        }
        folder="footer-media"
        title="Choose a footer badge"
      />

      {badges.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-white px-4 py-6 text-center text-xs text-muted">
          No badges yet. The footer badge row stays hidden until you add one.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {badges.map((badge, index) => (
            <li
              key={`${badge.url}-${index}`}
              className="flex flex-wrap items-center gap-3 p-3"
            >
              <div className="flex h-12 w-28 items-center justify-center rounded-lg bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element -- image is hosted on R2 */}
                <img
                  src={badge.url}
                  alt={badge.label}
                  className="max-h-10 max-w-full object-contain"
                />
              </div>
              <input
                value={badge.label}
                onChange={(event) => updateLabel(index, event.target.value)}
                placeholder="Label, e.g. Visa"
                aria-label={`Badge ${index + 1} label`}
                className="min-w-40 flex-1 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="rounded-lg border border-line p-2 text-muted hover:bg-subtle disabled:opacity-40"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === badges.length - 1}
                  aria-label="Move down"
                  className="rounded-lg border border-line p-2 text-muted hover:bg-subtle disabled:opacity-40"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove badge"
                  className="rounded-lg bg-deal/6 p-2 text-deal hover:bg-deal/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
