"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import Link from "next/link";

import type {
  ContactUsPageContent,
  ManagedPageContent,
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
    <section className="rounded-2xl border border-line bg-subtle p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

      <div className="mt-4 grid gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Eyebrow</span>
          <input
            value={value.eyebrow}
            onChange={(event) =>
              onChange(pageKey, "eyebrow", event.target.value)
            }
            className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Title</span>
          <input
            value={value.title}
            onChange={(event) => onChange(pageKey, "title", event.target.value)}
            className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Intro</span>
          <textarea
            value={value.intro}
            onChange={(event) => onChange(pageKey, "intro", event.target.value)}
            className="min-h-24 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Body Content</span>
          <textarea
            value={value.body}
            onChange={(event) => onChange(pageKey, "body", event.target.value)}
            className="min-h-40 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">CTA Label</span>
            <input
              value={value.ctaLabel}
              onChange={(event) =>
                onChange(pageKey, "ctaLabel", event.target.value)
              }
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">CTA Link</span>
            <input
              value={value.ctaHref}
              onChange={(event) =>
                onChange(pageKey, "ctaHref", event.target.value)
              }
              placeholder="/contact-us or tel:+441234567"
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
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
    <section className="rounded-2xl border border-line bg-subtle p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Contact Us
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Manage the exact content and labels shown on the contact page layout.
      </p>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Eyebrow</span>
            <input
              value={value.eyebrow}
              onChange={(event) => onChange("eyebrow", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Title</span>
            <input
              value={value.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Subtitle</span>
          <textarea
            value={value.intro}
            onChange={(event) => onChange("intro", event.target.value)}
            className="min-h-24 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand-strong">
          The phone number, address and email shown on this page are edited in
          Settings → Contact Details.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Phone Label
            </span>
            <input
              value={value.phoneLabel}
              onChange={(event) => onChange("phoneLabel", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Location Label
            </span>
            <input
              value={value.locationLabel}
              onChange={(event) =>
                onChange("locationLabel", event.target.value)
              }
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Email Label
            </span>
            <input
              value={value.emailLabel}
              onChange={(event) => onChange("emailLabel", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Full Name Label
            </span>
            <input
              value={value.fullNameLabel}
              onChange={(event) =>
                onChange("fullNameLabel", event.target.value)
              }
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Full Name Placeholder
            </span>
            <input
              value={value.fullNamePlaceholder}
              onChange={(event) =>
                onChange("fullNamePlaceholder", event.target.value)
              }
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Email Field Label
            </span>
            <input
              value={value.emailFieldLabel}
              onChange={(event) =>
                onChange("emailFieldLabel", event.target.value)
              }
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Email Field Placeholder
            </span>
            <input
              value={value.emailFieldPlaceholder}
              onChange={(event) =>
                onChange("emailFieldPlaceholder", event.target.value)
              }
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-1">
            <span className="text-xs font-semibold text-muted">
              Message Label
            </span>
            <input
              value={value.messageLabel}
              onChange={(event) => onChange("messageLabel", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-1">
            <span className="text-xs font-semibold text-muted">
              Submit Button Label
            </span>
            <input
              value={value.submitLabel}
              onChange={(event) => onChange("submitLabel", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">
            Message Placeholder
          </span>
          <textarea
            value={value.messagePlaceholder}
            onChange={(event) =>
              onChange("messagePlaceholder", event.target.value)
            }
            className="min-h-24 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>
    </section>
  );
}

type CareersSectionProps = {
  value: ManagedPageContent;
  onChange: (field: keyof ManagedPageContent, nextValue: string) => void;
};

function CareersSection({ value, onChange }: CareersSectionProps) {
  return (
    <section className="rounded-2xl border border-line bg-subtle p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Careers
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Manage the careers page text. Open roles are managed under{" "}
            <Link
              href="/admin/careers"
              className="font-medium text-brand hover:underline"
            >
              Careers
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Eyebrow</span>
            <input
              value={value.eyebrow}
              onChange={(event) => onChange("eyebrow", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Title</span>
            <input
              value={value.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Intro</span>
          <textarea
            value={value.intro}
            onChange={(event) => onChange("intro", event.target.value)}
            className="min-h-24 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Body</span>
          <textarea
            value={value.body}
            onChange={(event) => onChange("body", event.target.value)}
            className="min-h-32 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">CTA Label</span>
            <input
              value={value.ctaLabel}
              onChange={(event) => onChange("ctaLabel", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              Application Email Link
            </span>
            <input
              value={value.ctaHref}
              placeholder="mailto:careers@yourdomain.com"
              onChange={(event) => onChange("ctaHref", event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>
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

  function updateCareers(field: keyof ManagedPageContent, nextValue: string) {
    setForm((current) => ({
      ...current,
      careers: {
        ...current.careers,
        [field]: nextValue,
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
      <header>
        <h1 className="text-xl font-semibold text-navy">Site Pages</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Manage the database-backed content for About Us, Contact Us, Arrange a
          Call, FAQ, and legal pages.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Page Sections
          </p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setActivePanel("aboutUs")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "aboutUs"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("arrangeCall")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "arrangeCall"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Arrange a Call
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("contactUs")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "contactUs"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Contact Us
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("faq")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "faq"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("careers")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "careers"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Careers
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("termsConditions")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "termsConditions"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("privacyPolicy")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "privacyPolicy"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("refundPolicy")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "refundPolicy"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Refund Policy
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("cookiePolicy")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "cookiePolicy"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Cookie Policy
            </button>
          </div>
        </aside>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          {loading ? (
            <p className="text-sm text-muted">Loading page content...</p>
          ) : activePanel === null ? (
            <p className="text-sm text-muted">
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
                <section className="rounded-2xl border border-line bg-subtle p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                        FAQ
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Manage the page header and frequently asked questions
                        shown publicly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addFaqItem}
                      className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"
                    >
                      <Plus className="h-4 w-4" />
                      Add FAQ
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-muted">
                        Eyebrow
                      </span>
                      <input
                        value={form.faq.eyebrow}
                        onChange={(event) =>
                          updateFaqMeta("eyebrow", event.target.value)
                        }
                        className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-muted">
                        Title
                      </span>
                      <input
                        value={form.faq.title}
                        onChange={(event) =>
                          updateFaqMeta("title", event.target.value)
                        }
                        className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-muted">
                        Intro
                      </span>
                      <textarea
                        value={form.faq.intro}
                        onChange={(event) =>
                          updateFaqMeta("intro", event.target.value)
                        }
                        className="min-h-24 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                      />
                    </label>
                  </div>

                  <div className="mt-5 space-y-4">
                    {form.faq.faqs.map((item, index) => (
                      <div
                        key={`${index}-${item.question}`}
                        className="rounded-2xl border border-line bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-navy">
                            FAQ {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFaqItem(index)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-deal transition hover:bg-deal/6"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4">
                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted">
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
                              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                            />
                          </label>

                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted">
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
                              className="min-h-28 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {activePanel === "careers" ? (
                <CareersSection value={form.careers} onChange={updateCareers} />
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
                <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
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
