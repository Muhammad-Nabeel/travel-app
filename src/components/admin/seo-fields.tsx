"use client";

import { RotateCcw, Search } from "lucide-react";

import { useBrand } from "@/components/shared/brand-provider";
import { MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH } from "@/lib/seo-copy";
import { seoTitleBudget, type SeoCopy } from "@/lib/seo-suggestions";

/**
 * Form state for the SEO title/description pair. `null` means "follow the
 * suggestion": the field keeps updating as the admin edits the content above
 * it. Typing in the field pins it to a custom value.
 */
export type SeoDraft = { title: string | null; description: string | null };

export const EMPTY_SEO_DRAFT: SeoDraft = { title: null, description: null };

/** Draft for an existing record: stored values that still match the suggestion keep following it. */
export function seoDraftFrom(stored: { seoTitle: string; seoDescription: string }, suggestion: SeoCopy): SeoDraft {
  return {
    title: stored.seoTitle === suggestion.title ? null : stored.seoTitle,
    description: stored.seoDescription === suggestion.description ? null : stored.seoDescription,
  };
}

/** The values to save. */
export function resolveSeoDraft(draft: SeoDraft, suggestion: SeoCopy) {
  return {
    seoTitle: (draft.title ?? suggestion.title).trim(),
    seoDescription: (draft.description ?? suggestion.description).trim(),
  };
}

/** Blocks saving a title that would be cut off in search results once " | <brand>" is added. */
export function seoTitleBudgetIssue(title: string, brand: string) {
  const budget = seoTitleBudget(brand);
  return title.trim().length > budget
    ? `SEO title is ${title.trim().length} characters; keep it to ${budget} so " | ${brand}" still fits in search results.`
    : null;
}

function counterTone(length: number, min: number, max: number) {
  if (length > max) return "text-deal";
  if (length < min) return "text-gold-strong";
  return "text-success";
}

type SeoFieldsProps = {
  draft: SeoDraft;
  suggestion: SeoCopy;
  onChange: (draft: SeoDraft) => void;
  /** Public path of the page, shown in the search preview. */
  path: string;
};

export function SeoFields({ draft, suggestion, onChange, path }: SeoFieldsProps) {
  const brand = useBrand();
  const budget = seoTitleBudget(brand.name);
  const { seoTitle: title, seoDescription: description } = resolveSeoDraft(draft, suggestion);

  return (
    <section className="rounded-xl border border-line bg-subtle/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-semibold text-navy">Search engine listing</h3>
        </div>
        <p className="text-xs text-muted">
          Filled in from the details above until you edit it.
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-line bg-white px-4 py-3">
        <p className="truncate text-xs text-muted">
          {brand.name} › {path}
        </p>
        <p className="mt-0.5 truncate text-lg leading-snug text-[#1a0dab]">
          {title || "SEO title"} | {brand.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted">
          {description || "SEO description"}
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
            <span>
              SEO title *
              {draft.title === null ? (
                <span className="ml-2 rounded bg-line px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  Auto
                </span>
              ) : null}
            </span>
            <span className={counterTone(title.length, 30, budget)}>
              {title.length} / {budget}
            </span>
          </span>
          <input
            value={title}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
            className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          {draft.title !== null && draft.title !== suggestion.title ? (
            <button
              type="button"
              onClick={() => onChange({ ...draft, title: null })}
              className="inline-flex items-center gap-1 self-start text-xs font-medium text-brand-strong hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Use suggestion: {suggestion.title}
            </button>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
            <span>
              SEO description *
              {draft.description === null ? (
                <span className="ml-2 rounded bg-line px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  Auto
                </span>
              ) : null}
            </span>
            <span
              className={counterTone(description.length, MIN_DESCRIPTION_LENGTH, MAX_DESCRIPTION_LENGTH)}
            >
              {description.length} / {MAX_DESCRIPTION_LENGTH}
            </span>
          </span>
          <textarea
            value={description}
            rows={3}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <span className="text-xs text-muted">
            Aim for {MIN_DESCRIPTION_LENGTH}–{MAX_DESCRIPTION_LENGTH} characters.
          </span>
          {draft.description !== null && draft.description !== suggestion.description ? (
            <button
              type="button"
              onClick={() => onChange({ ...draft, description: null })}
              className="inline-flex items-center gap-1 self-start text-xs font-medium text-brand-strong hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Use suggested description
            </button>
          ) : null}
        </label>
      </div>
    </section>
  );
}
