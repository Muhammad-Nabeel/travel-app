"use client";

import { useEffect, useState } from "react";

import type { SeoSettings } from "@/lib/admin-settings/seo-settings";
import { useBrand } from "@/components/shared/brand-provider";
import { MediaUrlInput } from "@/components/admin/media-picker";
import {
  applySeoTokens,
  fullTitleLength,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  STATIC_PAGE_KEYS,
  STATIC_PAGE_SEO,
  type StaticPageKey,
} from "@/lib/seo-copy";

const EMPTY_FORM: SeoSettings = {
  pages: Object.fromEntries(
    STATIC_PAGE_KEYS.map((key) => [key, { title: "", description: "" }]),
  ) as SeoSettings["pages"],
  organization: {
    legalName: "",
    logoUrl: "",
    telephone: "",
    email: "",
    sameAs: [],
  },
};

const inputClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500";

function LengthHint({
  length,
  min,
  max,
}: {
  length: number;
  min?: number;
  max: number;
}) {
  const ok = length <= max && (min === undefined || length >= min);
  return (
    <span className={`text-xs ${ok ? "text-emerald-600" : "text-amber-600"}`}>
      {length} / {min !== undefined ? `${min}–` : ""}
      {max}
    </span>
  );
}

function SeoPageCard({
  pageKey,
  value,
  onChange,
}: {
  pageKey: StaticPageKey;
  value: SeoSettings["pages"][StaticPageKey];
  onChange: (field: "title" | "description", nextValue: string) => void;
}) {
  const { name: brandName } = useBrand();
  const defaults = STATIC_PAGE_SEO[pageKey];
  const absolute = Boolean(defaults.absolute);
  const title = applySeoTokens(value.title || defaults.title, new Date(), brandName);
  const description = applySeoTokens(
    value.description || defaults.description,
    new Date(),
    brandName,
  );
  const shownTitle = absolute ? title : `${title} | ${brandName}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          {defaults.label}
        </p>
        <code className="text-xs text-slate-500">{defaults.path}</code>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Search title{" "}
              {absolute ? "(shown exactly)" : `(“ | ${brandName}” is added)`}
            </span>
            <LengthHint
              length={fullTitleLength(title, absolute)}
              max={MAX_TITLE_LENGTH}
            />
          </span>
          <input
            value={value.title}
            placeholder={defaults.title}
            onChange={(event) => onChange("title", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Meta description</span>
            <LengthHint
              length={description.length}
              min={MIN_DESCRIPTION_LENGTH}
              max={MAX_DESCRIPTION_LENGTH}
            />
          </span>
          <textarea
            value={value.description}
            placeholder={defaults.description}
            onChange={(event) => onChange("description", event.target.value)}
            className={`min-h-20 ${inputClass}`}
          />
        </label>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Google preview</p>
          <p className="mt-1 truncate text-lg text-[#1a0dab]">{shownTitle}</p>
          <p className="line-clamp-2 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </section>
  );
}

export default function AdminSeoPage() {
  const [form, setForm] = useState<SeoSettings>(EMPTY_FORM);
  const [sameAsText, setSameAsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/settings/seo", { cache: "no-store" })
      .then((response) => response.json() as Promise<SeoSettings>)
      .then((json) => {
        if (cancelled) return;
        setForm(json);
        setSameAsText(json.organization.sameAs.join("\n"));
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load SEO settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updatePage(
    key: StaticPageKey,
    field: "title" | "description",
    nextValue: string,
  ) {
    setForm((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [key]: { ...current.pages[key], [field]: nextValue },
      },
    }));
  }

  function updateOrganization(
    field: "legalName" | "logoUrl" | "telephone" | "email",
    nextValue: string,
  ) {
    setForm((current) => ({
      ...current,
      organization: { ...current.organization, [field]: nextValue },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload: SeoSettings = {
        ...form,
        organization: {
          ...form.organization,
          sameAs: sameAsText
            .split(/\s+/)
            .map((item) => item.trim())
            .filter(Boolean),
        },
      };

      const response = await fetch("/api/admin/settings/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to save SEO settings.");
      }

      const saved = (await response.json()) as SeoSettings;
      setForm(saved);
      setSameAsText(saved.organization.sameAs.join("\n"));
      setMessage("SEO settings saved. Changes appear on the live site immediately.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SEO settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-blue-950 sm:text-3xl">
          SEO
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800/80 sm:text-base">
          Search titles and descriptions for each page, and the business details
          Google shows about your company. Leave a field empty to use the
          recommended default shown in grey. Use {"{year}"} to insert the current
          booking season year.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Business profile (structured data)
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Only fill in details that are accurate. Empty fields are left out
              of the data sent to Google. Branch addresses come from
              Settings → Branches.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Registered company name
                </span>
                <input
                  value={form.organization.legalName}
                  onChange={(event) =>
                    updateOrganization("legalName", event.target.value)
                  }
                  className={inputClass}
                />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Logo URL (https)
                </span>
                <MediaUrlInput
                  value={form.organization.logoUrl}
                  onChange={(url) => updateOrganization("logoUrl", url)}
                  folder="website-logo"
                  inputClassName={inputClass}
                />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Customer service phone
                </span>
                <input
                  value={form.organization.telephone}
                  onChange={(event) =>
                    updateOrganization("telephone", event.target.value)
                  }
                  placeholder="+92 42 1234567"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Customer service email
                </span>
                <input
                  value={form.organization.email}
                  onChange={(event) =>
                    updateOrganization("email", event.target.value)
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Social and listing profiles (one https URL per line: Facebook,
                  Instagram, Google Business Profile…)
                </span>
                <textarea
                  value={sameAsText}
                  onChange={(event) => setSameAsText(event.target.value)}
                  className={`min-h-24 ${inputClass}`}
                />
              </label>
            </div>
          </section>

          <div className="grid gap-4">
            {STATIC_PAGE_KEYS.map((key) => (
              <SeoPageCard
                key={key}
                pageKey={key}
                value={form.pages[key]}
                onChange={(field, nextValue) => updatePage(key, field, nextValue)}
              />
            ))}
          </div>

          <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save SEO settings"}
            </button>
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </>
      )}
    </div>
  );
}
