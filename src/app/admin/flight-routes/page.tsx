"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { ZodError } from "zod";

import {
  EMPTY_SEO_DRAFT,
  SeoFields,
  resolveSeoDraft,
  seoDraftFrom,
  seoTitleBudgetIssue,
} from "@/components/admin/seo-fields";
import { AdminPagination } from "@/components/admin/pagination";
import { usePagination } from "@/components/admin/use-pagination";
import { useBrand } from "@/components/shared/brand-provider";
import { suggestFlightRouteSeo } from "@/lib/seo-suggestions";
import {
  flightRouteSchema,
  flightRouteSlug,
  getFlightRoutePath,
  type FlightRouteAirline,
  type FlightRouteFaq,
} from "@/lib/validations/flight-route";

type FlightRouteRow = {
  id: string;
  slug: string;
  originCity: string;
  originIata: string;
  originAirport: string;
  destinationCity: string;
  destinationCountry: string;
  destinationIata: string;
  destinationAirport: string;
  intro: string;
  flightTime: string;
  distance: string;
  airlines: FlightRouteAirline[];
  travelTips: string[];
  documents: string[];
  faqs: FlightRouteFaq[];
  fareFrom: string | null;
  isActive: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

const INPUT =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

const EMPTY_FORM = {
  originCity: "",
  originIata: "",
  originAirport: "",
  destinationCity: "",
  destinationCountry: "",
  destinationIata: "",
  destinationAirport: "",
  intro: "",
  flightTime: "",
  distance: "",
  travelTipsText: "",
  documentsText: "",
  fareFrom: "",
  isActive: false,
  sortOrder: "0",
};

type FormState = typeof EMPTY_FORM;
type TextField = Exclude<keyof FormState, "isActive">;

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-muted">
        {label}
        {hint ? <span className="ml-1 font-normal">({hint})</span> : null}
      </span>
      {children}
    </label>
  );
}

export default function AdminFlightRoutesPage() {
  const brand = useBrand();
  const [routes, setRoutes] = useState<FlightRouteRow[]>([]);
  const pagination = usePagination(routes);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [airlines, setAirlines] = useState<FlightRouteAirline[]>([]);
  const [faqs, setFaqs] = useState<FlightRouteFaq[]>([]);
  const [seoDraft, setSeoDraft] = useState(EMPTY_SEO_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const seoSuggestion = suggestFlightRouteSeo(
    {
      originCity: form.originCity,
      destinationCity: form.destinationCity,
      flightTime: form.flightTime,
      airlines,
      fareFrom: form.fareFrom,
    },
    brand.name,
  );
  const previewPath =
    form.originCity && form.destinationCity
      ? getFlightRoutePath(flightRouteSlug(form.originCity, form.destinationCity))
      : "/flights/…";

  async function loadRoutes() {
    try {
      const response = await fetch("/api/admin/flight-routes", { cache: "no-store" });
      const json = (await response.json()) as { routes?: FlightRouteRow[]; error?: string };
      if (!response.ok) throw new Error(json.error ?? "Unable to load flight routes.");
      setRoutes(json.routes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load flight routes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoutes();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setAirlines([]);
    setFaqs([]);
    setSeoDraft(EMPTY_SEO_DRAFT);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startCreate() {
    resetForm();
    setAirlines([{ name: "", code: "", service: "Non-stop" }]);
    setShowForm(true);
    setMessage("");
  }

  function startEdit(route: FlightRouteRow) {
    setEditingId(route.id);
    setForm({
      originCity: route.originCity,
      originIata: route.originIata,
      originAirport: route.originAirport,
      destinationCity: route.destinationCity,
      destinationCountry: route.destinationCountry,
      destinationIata: route.destinationIata,
      destinationAirport: route.destinationAirport,
      intro: route.intro,
      flightTime: route.flightTime,
      distance: route.distance,
      travelTipsText: route.travelTips.join("\n"),
      documentsText: route.documents.join("\n"),
      fareFrom: route.fareFrom ?? "",
      isActive: route.isActive,
      sortOrder: String(route.sortOrder),
    });
    setAirlines(route.airlines);
    setFaqs(route.faqs);
    setSeoDraft(
      seoDraftFrom(
        route,
        suggestFlightRouteSeo(
          {
            originCity: route.originCity,
            destinationCity: route.destinationCity,
            flightTime: route.flightTime,
            airlines: route.airlines,
            fareFrom: route.fareFrom,
          },
          brand.name,
        ),
      ),
    );
    setShowForm(true);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const text = (key: TextField) => ({
    value: form[key],
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const seo = resolveSeoDraft(seoDraft, seoSuggestion);
      const titleIssue = seoTitleBudgetIssue(seo.seoTitle, brand.name);
      if (titleIssue) {
        setError(titleIssue);
        return;
      }

      const payload = flightRouteSchema.parse({
        originCity: form.originCity,
        originIata: form.originIata,
        originAirport: form.originAirport,
        destinationCity: form.destinationCity,
        destinationCountry: form.destinationCountry,
        destinationIata: form.destinationIata,
        destinationAirport: form.destinationAirport,
        intro: form.intro,
        flightTime: form.flightTime,
        distance: form.distance,
        airlines,
        travelTips: lines(form.travelTipsText),
        documents: lines(form.documentsText),
        faqs,
        fareFrom: form.fareFrom,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        ...seo,
      });

      setSaving(true);
      const response = await fetch(
        editingId ? `/api/admin/flight-routes/${editingId}` : "/api/admin/flight-routes",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Failed to save flight route.");

      resetForm();
      setMessage("Flight route saved.");
      await loadRoutes();
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message ?? "Please check the form.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to save flight route.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(route: FlightRouteRow) {
    if (!window.confirm(`Delete the ${route.originCity} to ${route.destinationCity} page?`)) return;
    const response = await fetch(`/api/admin/flight-routes/${route.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Failed to delete flight route.");
      return;
    }
    setMessage("Flight route deleted.");
    await loadRoutes();
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-navy">Flight Routes</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Landing pages such as /flights/lahore-to-jeddah. Check the airline
            list against current schedules before publishing: drafts are not
            visible on the site or in the sitemap.
          </p>
        </div>
        {!showForm ? (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            <Plus className="size-4" />
            Add route
          </button>
        ) : null}
      </header>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error && !showForm ? <p className="text-sm text-deal">{error}</p> : null}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-line bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">
              {editingId ? "Edit route" : "New route"}
            </h2>
            <button type="button" onClick={resetForm} aria-label="Close form">
              <X className="size-5 text-muted" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="From city">
              <input {...text("originCity")} placeholder="Lahore" className={INPUT} />
            </Field>
            <Field label="From airport code">
              <input {...text("originIata")} placeholder="LHE" maxLength={3} className={INPUT} />
            </Field>
            <Field label="From airport name" className="lg:col-span-2">
              <input
                {...text("originAirport")}
                placeholder="Allama Iqbal International Airport"
                className={INPUT}
              />
            </Field>
            <Field label="To city">
              <input {...text("destinationCity")} placeholder="Jeddah" className={INPUT} />
            </Field>
            <Field label="To country">
              <input {...text("destinationCountry")} placeholder="Saudi Arabia" className={INPUT} />
            </Field>
            <Field label="To airport code">
              <input {...text("destinationIata")} placeholder="JED" maxLength={3} className={INPUT} />
            </Field>
            <Field label="To airport name">
              <input
                {...text("destinationAirport")}
                placeholder="King Abdulaziz International Airport"
                className={INPUT}
              />
            </Field>
            <Field label="Flight time">
              <input {...text("flightTime")} placeholder="About 4 hr 45 min non-stop" className={INPUT} />
            </Field>
            <Field label="Distance">
              <input {...text("distance")} placeholder="About 3,000 km" className={INPUT} />
            </Field>
            <Field label="Fare from" hint="optional; lowest one-way fare per adult, shown on the page">
              <input {...text("fareFrom")} placeholder="PKR 95,000" className={INPUT} />
            </Field>
            <Field label="Sort order">
              <input {...text("sortOrder")} type="number" min={0} className={INPUT} />
            </Field>
          </div>

          <Field label="Introduction" hint="200+ characters; blank line between paragraphs">
            <textarea {...text("intro")} rows={7} className={INPUT} />
          </Field>

          <div className="grid gap-3">
            <span className="text-xs font-semibold text-muted">
              Airlines on this route (service: &quot;Non-stop&quot; or &quot;1 stop via Dubai&quot;)
            </span>
            {airlines.map((airline, index) => {
              const set = (patch: Partial<FlightRouteAirline>) =>
                setAirlines((current) =>
                  current.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
                );
              return (
                <div key={index} className="grid gap-2 sm:grid-cols-[2fr_80px_2fr_auto]">
                  <input
                    value={airline.name}
                    onChange={(event) => set({ name: event.target.value })}
                    placeholder="Saudia"
                    className={INPUT}
                  />
                  <input
                    value={airline.code}
                    onChange={(event) => set({ code: event.target.value })}
                    placeholder="SV"
                    maxLength={2}
                    className={INPUT}
                  />
                  <input
                    value={airline.service}
                    onChange={(event) => set({ service: event.target.value })}
                    placeholder="Non-stop"
                    className={INPUT}
                  />
                  <button
                    type="button"
                    onClick={() => setAirlines((current) => current.filter((_, idx) => idx !== index))}
                    className="text-xs font-semibold text-deal"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() =>
                setAirlines((current) => [...current, { name: "", code: "", service: "Non-stop" }])
              }
              className="inline-flex items-center gap-2 justify-self-start rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy/80"
            >
              <Plus className="size-3.5" />
              Add airline
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Travel tips" hint="one per line">
              <textarea {...text("travelTipsText")} rows={6} className={INPUT} />
            </Field>
            <Field label="Documents to carry" hint="one per line">
              <textarea {...text("documentsText")} rows={6} className={INPUT} />
            </Field>
          </div>

          <div className="grid gap-3">
            <span className="text-xs font-semibold text-muted">
              FAQs (shown on the page and sent to Google)
            </span>
            {faqs.map((faq, index) => {
              const set = (patch: Partial<FlightRouteFaq>) =>
                setFaqs((current) =>
                  current.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
                );
              return (
                <div key={index} className="grid gap-2 rounded-xl border border-line p-3">
                  <input
                    value={faq.question}
                    onChange={(event) => set({ question: event.target.value })}
                    placeholder="Question"
                    className={INPUT}
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(event) => set({ answer: event.target.value })}
                    placeholder="Answer"
                    rows={2}
                    className={INPUT}
                  />
                  <button
                    type="button"
                    onClick={() => setFaqs((current) => current.filter((_, idx) => idx !== index))}
                    className="justify-self-start text-xs font-semibold text-deal"
                  >
                    Remove FAQ
                  </button>
                </div>
              );
            })}
            {faqs.length < 10 ? (
              <button
                type="button"
                onClick={() => setFaqs((current) => [...current, { question: "", answer: "" }])}
                className="inline-flex items-center gap-2 justify-self-start rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy/80"
              >
                <Plus className="size-3.5" />
                Add FAQ
              </button>
            ) : null}
          </div>

          <SeoFields
            draft={seoDraft}
            suggestion={seoSuggestion}
            onChange={setSeoDraft}
            path={previewPath}
          />

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({ ...current, isActive: event.target.checked }))
              }
            />
            Published (I have checked the airline list against current schedules)
          </label>

          {error ? <p className="text-sm text-deal">{error}</p> : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create route"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-line px-5 py-2 text-sm font-semibold text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-muted">Loading…</p>
        ) : routes.length === 0 ? (
          <p className="p-5 text-sm text-muted">No flight routes yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-subtle text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Airlines</th>
                <th className="px-4 py-3">FAQs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pagination.pageItems.map((route) => (
                <tr key={route.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {route.originCity} → {route.destinationCity}
                    </p>
                    <p className="text-xs text-muted">{getFlightRoutePath(route.slug)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{route.airlines.length}</td>
                  <td className="px-4 py-3 text-muted">{route.faqs.length}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        route.isActive ? "bg-success/10 text-success" : "bg-gold/15 text-gold-strong"
                      }`}
                    >
                      {route.isActive ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {route.isActive ? (
                        <a
                          href={getFlightRoutePath(route.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View page"
                          className="text-muted hover:text-brand"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEdit(route)}
                        aria-label="Edit route"
                        className="text-muted hover:text-brand"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(route)}
                        aria-label="Delete route"
                        className="text-muted hover:text-deal"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AdminPagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          total={pagination.total}
          label="flight routes"
          onPageChange={pagination.setPage}
        />
      </section>
    </main>
  );
}
