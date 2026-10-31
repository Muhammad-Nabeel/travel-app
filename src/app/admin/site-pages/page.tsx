"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type {
  CareerJob,
  ContactUsPageContent,
  CareersPageContent,
  SitePagesSettings,
} from "@/lib/admin-settings/site-pages-settings";

const EMPTY_PAGES_FORM: SitePagesSettings = {
  aboutUs: {
    eyebrow: "",
    title: "",
    intro: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
  },
  contactUs: {
    eyebrow: "",
    title: "",
    intro: "",
    phoneLabel: "",
    locationLabel: "",
    emailLabel: "",
    fullNameLabel: "",
    fullNamePlaceholder: "",
    emailFieldLabel: "",
    emailFieldPlaceholder: "",
    messageLabel: "",
    messagePlaceholder: "",
    submitLabel: "",
  },
  arrangeCall: {
    eyebrow: "",
    title: "",
    intro: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
  },
  faq: {
    eyebrow: "",
    title: "",
    intro: "",
    faqs: [],
  },
  careers: {
    eyebrow: "",
    title: "",
    intro: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
    jobs: [],
  },
  termsConditions: {
    eyebrow: "",
    title: "",
    intro: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
  },
  privacyPolicy: {
    eyebrow: "",
    title: "",
    intro: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
  },
  refundPolicy: {
    eyebrow: "",
    title: "",
    intro: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
  },
  cookiePolicy: {
    eyebrow: "",
    title: "",
    intro: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
  },
};

type StaticPageKey =
  | "aboutUs"
  | "arrangeCall"
  | "termsConditions"
  | "privacyPolicy"
  | "refundPolicy"
  | "cookiePolicy";

type SitePagesPanel =
  | "aboutUs"
  | "arrangeCall"
  | "contactUs"
  | "faq"
  | "careers"
  | "termsConditions"
  | "privacyPolicy"
  | "refundPolicy"
  | "cookiePolicy"
  | null;

type StaticPageSectionProps = {
  pageKey: StaticPageKey;
  label: string;
  description: string;
  value: SitePagesSettings[StaticPageKey];
  onChange: (
    pageKey: StaticPageKey,
    field: keyof SitePagesSettings[StaticPageKey],
    nextValue: string,
  ) => void;
};

function StaticPageSection({
  pageKey,
  label,
  description,
  value,
  onChange,
}: StaticPageSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-4 grid gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Eyebrow</span>
          <input
            value={value.eyebrow}
            onChange={(event) =>
              onChange(pageKey, "eyebrow", event.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Title</span>
          <input
            value={value.title}
            onChange={(event) => onChange(pageKey, "title", event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Intro</span>
          <textarea
            value={value.intro}
            onChange={(event) => onChange(pageKey, "intro", event.target.value)}
            className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">
            Body Content
          </span>
          <textarea
            value={value.body}
            onChange={(event) => onChange(pageKey, "body", event.target.value)}
            className="min-h-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              CTA Label
            </span>
            <input
              value={value.ctaLabel}
              onChange={(event) =>
                onChange(pageKey, "ctaLabel", event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              CTA Link
            </span>
            <input
              value={value.ctaHref}
              onChange={(event) =>
                onChange(pageKey, "ctaHref", event.target.value)
              }
              placeholder="/contact-us or tel:+441234567"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
        </div>
      </div>
    </section>
  );
}

type ContactUsSectionProps = {
  value: ContactUsPageContent;
  onChange: (field: keyof ContactUsPageContent, nextValue: string) => void;
};

function ContactUsSection({ value, onChange }: ContactUsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Contact Us
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Manage the exact content and labels shown on the contact page layout.
      </p>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Eyebrow
            </span>
            <input
              value={value.eyebrow}
              onChange={(event) => onChange("eyebrow", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Title</span>
            <input
              value={value.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Subtitle</span>
          <textarea
            value={value.intro}
            onChange={(event) => onChange("intro", event.target.value)}
            className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </label>

        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          The phone number, address and email shown on this page are edited in
          Settings → Contact Details.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Phone Label
            </span>
            <input
              value={value.phoneLabel}
              onChange={(event) => onChange("phoneLabel", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Location Label
            </span>
            <input
              value={value.locationLabel}
              onChange={(event) =>
                onChange("locationLabel", event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Email Label
            </span>
            <input
              value={value.emailLabel}
              onChange={(event) => onChange("emailLabel", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Full Name Label
            </span>
            <input
              value={value.fullNameLabel}
              onChange={(event) =>
                onChange("fullNameLabel", event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Full Name Placeholder
            </span>
            <input
              value={value.fullNamePlaceholder}
              onChange={(event) =>
                onChange("fullNamePlaceholder", event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Email Field Label
            </span>
            <input
              value={value.emailFieldLabel}
              onChange={(event) =>
                onChange("emailFieldLabel", event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Email Field Placeholder
            </span>
            <input
              value={value.emailFieldPlaceholder}
              onChange={(event) =>
                onChange("emailFieldPlaceholder", event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-1">
            <span className="text-xs font-semibold text-slate-600">
              Message Label
            </span>
            <input
              value={value.messageLabel}
              onChange={(event) => onChange("messageLabel", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-1">
            <span className="text-xs font-semibold text-slate-600">
              Submit Button Label
            </span>
            <input
              value={value.submitLabel}
              onChange={(event) => onChange("submitLabel", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">
            Message Placeholder
          </span>
          <textarea
            value={value.messagePlaceholder}
            onChange={(event) =>
              onChange("messagePlaceholder", event.target.value)
            }
            className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </label>
      </div>
    </section>
  );
}

type CareersSectionProps = {
  value: CareersPageContent;
  onChange: (field: keyof CareersPageContent, nextValue: string) => void;
  onJobChange: (
    index: number,
    field: keyof CareerJob,
    nextValue: string,
  ) => void;
  onAddJob: () => void;
  onRemoveJob: (index: number) => void;
};

function CareersSection({
  value,
  onChange,
  onJobChange,
  onAddJob,
  onRemoveJob,
}: CareersSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Careers
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage the careers page and current job openings.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddJob}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" />
          Add job
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Eyebrow
            </span>
            <input
              value={value.eyebrow}
              onChange={(event) => onChange("eyebrow", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Title</span>
            <input
              value={value.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Intro</span>
          <textarea
            value={value.intro}
            onChange={(event) => onChange("intro", event.target.value)}
            className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Body</span>
          <textarea
            value={value.body}
            onChange={(event) => onChange("body", event.target.value)}
            className="min-h-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              CTA Label
            </span>
            <input
              value={value.ctaLabel}
              onChange={(event) => onChange("ctaLabel", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              CTA Link
            </span>
            <input
              value={value.ctaHref}
              onChange={(event) => onChange("ctaHref", event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {value.jobs.map((job, index) => (
          <div
            key={`${job.title}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                Job {index + 1}
              </p>
              <button
                type="button"
                onClick={() => onRemoveJob(index)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Title
                </span>
                <input
                  value={job.title}
                  onChange={(event) =>
                    onJobChange(index, "title", event.target.value)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Location
                </span>
                <input
                  value={job.location}
                  onChange={(event) =>
                    onJobChange(index, "location", event.target.value)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Team
                </span>
                <input
                  value={job.team}
                  onChange={(event) =>
                    onJobChange(index, "team", event.target.value)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Type
                </span>
                <input
                  value={job.type}
                  onChange={(event) =>
                    onJobChange(index, "type", event.target.value)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">
                Summary
              </span>
              <textarea
                value={job.summary}
                onChange={(event) =>
                  onJobChange(index, "summary", event.target.value)
                }
                className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Apply Label
                </span>
                <input
                  value={job.applyLabel}
                  onChange={(event) =>
                    onJobChange(index, "applyLabel", event.target.value)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Apply Link
                </span>
                <input
                  value={job.applyHref}
                  onChange={(event) =>
                    onJobChange(index, "applyHref", event.target.value)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminSitePagesPage() {
  const [form, setForm] = useState<SitePagesSettings>(EMPTY_PAGES_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState<SitePagesPanel>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch("/api/admin/settings/content-pages", {
          cache: "no-store",
        });
        const json = (await response.json()) as SitePagesSettings;
        setForm(json);
      } catch {
        setError("Unable to load site pages content.");
      } finally {
        setLoading(false);
      }
    }

    void loadContent();
  }, []);

  function updateStaticPage(
    pageKey: StaticPageKey,
    field: keyof SitePagesSettings[StaticPageKey],
    nextValue: string,
  ) {
    setForm((current) => ({
      ...current,
      [pageKey]: {
        ...current[pageKey],
        [field]: nextValue,
      },
    }));
  }

  function updateContactUs(
    field: keyof ContactUsPageContent,
    nextValue: string,
  ) {
    setForm((current) => ({
      ...current,
      contactUs: {
        ...current.contactUs,
        [field]: nextValue,
      },
    }));
  }

  function updateCareers(field: keyof CareersPageContent, nextValue: string) {
    setForm((current) => ({
      ...current,
      careers: {
        ...current.careers,
        [field]: nextValue,
      },
    }));
  }

  function updateCareerJob(
    index: number,
    field: keyof CareerJob,
    nextValue: string,
  ) {
    setForm((current) => ({
      ...current,
      careers: {
        ...current.careers,
        jobs: current.careers.jobs.map((job, jobIndex) =>
          jobIndex === index ? { ...job, [field]: nextValue } : job,
        ),
      },
    }));
  }

  function addCareerJob() {
    setForm((current) => ({
      ...current,
      careers: {
        ...current.careers,
        jobs: [
          ...current.careers.jobs,
          {
            title: "",
            location: "",
            team: "",
            type: "",
            summary: "",
            applyLabel: "Apply",
            applyHref: "",
          },
        ],
      },
    }));
  }

  function removeCareerJob(index: number) {
    setForm((current) => ({
      ...current,
      careers: {
        ...current.careers,
        jobs: current.careers.jobs.filter((_, jobIndex) => jobIndex !== index),
      },
    }));
  }

  function updateFaqMeta(
    field: "eyebrow" | "title" | "intro",
    nextValue: string,
  ) {
    setForm((current) => ({
      ...current,
      faq: {
        ...current.faq,
        [field]: nextValue,
      },
    }));
  }

  function updateFaqItem(
    index: number,
    field: "question" | "answer",
    nextValue: string,
  ) {
    setForm((current) => ({
      ...current,
      faq: {
        ...current.faq,
        faqs: current.faq.faqs.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: nextValue } : item,
        ),
      },
    }));
  }

  function addFaqItem() {
    setForm((current) => ({
      ...current,
      faq: {
        ...current.faq,
        faqs: [...current.faq.faqs, { question: "", answer: "" }],
      },
    }));
  }

  function removeFaqItem(index: number) {
    setForm((current) => ({
      ...current,
      faq: {
        ...current.faq,
        faqs: current.faq.faqs.filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/settings/content-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to save site pages content.");
      }

      const saved = (await response.json()) as SitePagesSettings;
      setForm(saved);
      setMessage("Site pages content saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save site pages content.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-blue-950 sm:text-3xl">
          Site Pages
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800/80 sm:text-base">
          Manage the database-backed content for About Us, Contact Us, Arrange a
          Call, FAQ, and legal pages.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Page Sections
          </p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setActivePanel("aboutUs")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "aboutUs"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("arrangeCall")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "arrangeCall"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Arrange a Call
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("contactUs")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "contactUs"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Contact Us
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("faq")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "faq"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("careers")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "careers"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Careers
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("termsConditions")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "termsConditions"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("privacyPolicy")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "privacyPolicy"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("refundPolicy")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "refundPolicy"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Refund Policy
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("cookiePolicy")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "cookiePolicy"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cookie Policy
            </button>
          </div>
        </aside>

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-500">Loading page content...</p>
          ) : activePanel === null ? (
            <p className="text-sm text-slate-500">
              Select any section from the left to start editing content.
            </p>
          ) : (
            <div className="space-y-5">
              {activePanel === "aboutUs" ? (
                <StaticPageSection
                  pageKey="aboutUs"
                  label="About Us"
                  description="Edit the narrative and CTA shown on the About Us page."
                  value={form.aboutUs}
                  onChange={updateStaticPage}
                />
              ) : null}

              {activePanel === "arrangeCall" ? (
                <StaticPageSection
                  pageKey="arrangeCall"
                  label="Arrange a Call"
                  description="Set expectations for call-back help, booking consultations, and advisory support."
                  value={form.arrangeCall}
                  onChange={updateStaticPage}
                />
              ) : null}

              {activePanel === "contactUs" ? (
                <ContactUsSection
                  value={form.contactUs}
                  onChange={updateContactUs}
                />
              ) : null}

              {activePanel === "faq" ? (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                        FAQ
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Manage the page header and frequently asked questions
                        shown publicly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addFaqItem}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add FAQ
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-slate-600">
                        Eyebrow
                      </span>
                      <input
                        value={form.faq.eyebrow}
                        onChange={(event) =>
                          updateFaqMeta("eyebrow", event.target.value)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-slate-600">
                        Title
                      </span>
                      <input
                        value={form.faq.title}
                        onChange={(event) =>
                          updateFaqMeta("title", event.target.value)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-slate-600">
                        Intro
                      </span>
                      <textarea
                        value={form.faq.intro}
                        onChange={(event) =>
                          updateFaqMeta("intro", event.target.value)
                        }
                        className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    </label>
                  </div>

                  <div className="mt-5 space-y-4">
                    {form.faq.faqs.map((item, index) => (
                      <div
                        key={`${index}-${item.question}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            FAQ {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFaqItem(index)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4">
                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-slate-600">
                              Question
                            </span>
                            <input
                              value={item.question}
                              onChange={(event) =>
                                updateFaqItem(
                                  index,
                                  "question",
                                  event.target.value,
                                )
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                            />
                          </label>

                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-slate-600">
                              Answer
                            </span>
                            <textarea
                              value={item.answer}
                              onChange={(event) =>
                                updateFaqItem(
                                  index,
                                  "answer",
                                  event.target.value,
                                )
                              }
                              className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {activePanel === "careers" ? (
                <CareersSection
                  value={form.careers}
                  onChange={updateCareers}
                  onJobChange={updateCareerJob}
                  onAddJob={addCareerJob}
                  onRemoveJob={removeCareerJob}
                />
              ) : null}

              {activePanel === "termsConditions" ? (
                <StaticPageSection
                  pageKey="termsConditions"
                  label="Terms & Conditions"
                  description="Update the terms and conditions shown on the legal page."
                  value={form.termsConditions}
                  onChange={updateStaticPage}
                />
              ) : null}

              {activePanel === "privacyPolicy" ? (
                <StaticPageSection
                  pageKey="privacyPolicy"
                  label="Privacy Policy"
                  description="Update the privacy policy content and CTA details."
                  value={form.privacyPolicy}
                  onChange={updateStaticPage}
                />
              ) : null}

              {activePanel === "refundPolicy" ? (
                <StaticPageSection
                  pageKey="refundPolicy"
                  label="Refund Policy"
                  description="Set refund policy guidance for bookings and service fees."
                  value={form.refundPolicy}
                  onChange={updateStaticPage}
                />
              ) : null}

              {activePanel === "cookiePolicy" ? (
                <StaticPageSection
                  pageKey="cookiePolicy"
                  label="Cookie Policy"
                  description="Update cookie usage and consent details."
                  value={form.cookiePolicy}
                  onChange={updateStaticPage}
                />
              ) : null}

              {message ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Site Pages"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
