"use client";

import { useEffect, useState } from "react";

const EMPTY_FORM = {
  measurementId: "",
  propertyId: "",
  serviceAccountEmail: "",
  serviceAccountPrivateKey: "",
};

const EMPTY_PRICING_FORM = {
  serviceChargePercent: "0",
};

const EMPTY_SUPPORT_FORM = {
  mobileNumber: "",
  landlineNumber: "",
};

type SettingsPanel = "ga4" | "pricing" | "support" | null;

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [hasStoredPrivateKey, setHasStoredPrivateKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testError, setTestError] = useState("");
  const [pricingForm, setPricingForm] = useState(EMPTY_PRICING_FORM);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingMessage, setPricingMessage] = useState("");
  const [pricingError, setPricingError] = useState("");
  const [supportForm, setSupportForm] = useState(EMPTY_SUPPORT_FORM);
  const [supportSaving, setSupportSaving] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportError, setSupportError] = useState("");
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [res, pricingRes, supportRes] = await Promise.all([
          fetch("/api/admin/settings/ga4", {
            cache: "no-store",
          }),
          fetch("/api/admin/settings/site-pricing", {
            cache: "no-store",
          }),
          fetch("/api/admin/settings/support-contact", {
            cache: "no-store",
          }),
        ]);

        const json = (await res.json()) as {
          measurementId?: string;
          propertyId?: string;
          serviceAccountEmail?: string;
          hasPrivateKey?: boolean;
        };

        setFormData({
          measurementId: json.measurementId ?? "",
          propertyId: json.propertyId ?? "",
          serviceAccountEmail: json.serviceAccountEmail ?? "",
          serviceAccountPrivateKey: "",
        });
        setHasStoredPrivateKey(Boolean(json.hasPrivateKey));

        const pricingJson = (await pricingRes.json()) as {
          serviceChargePercent?: number;
        };

        const supportJson = (await supportRes.json()) as {
          mobileNumber?: string;
          landlineNumber?: string;
        };

        setPricingForm({
          serviceChargePercent: String(pricingJson.serviceChargePercent ?? 0),
        });
        setSupportForm({
          mobileNumber: supportJson.mobileNumber ?? "",
          landlineNumber: supportJson.landlineNumber ?? "",
        });
      } catch {
        setError("Unable to load settings.");
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/settings/ga4", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to save settings");
      }

      setMessage("GA4 settings saved successfully.");
      if (formData.serviceAccountPrivateKey.trim()) {
        setHasStoredPrivateKey(true);
      }
      setFormData((prev) => ({ ...prev, serviceAccountPrivateKey: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestMessage("");
    setTestError("");

    try {
      const res = await fetch("/api/admin/settings/ga4?test=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? "GA4 connection test failed.");
      }

      setTestMessage(json.message ?? "GA4 connection is successful.");
    } catch (err) {
      setTestError(
        err instanceof Error ? err.message : "GA4 connection test failed.",
      );
    } finally {
      setTesting(false);
    }
  }

  async function handlePricingSave() {
    setPricingSaving(true);
    setPricingMessage("");
    setPricingError("");

    try {
      const res = await fetch("/api/admin/settings/site-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceChargePercent: Number(pricingForm.serviceChargePercent || 0),
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to save pricing settings");
      }

      setPricingMessage("Site pricing settings saved successfully.");
    } catch (err) {
      setPricingError(
        err instanceof Error ? err.message : "Failed to save pricing settings",
      );
    } finally {
      setPricingSaving(false);
    }
  }

  async function handleSupportSave() {
    setSupportSaving(true);
    setSupportMessage("");
    setSupportError("");

    try {
      const res = await fetch("/api/admin/settings/support-contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to save support settings");
      }

      const saved = (await res.json()) as {
        mobileNumber?: string;
        landlineNumber?: string;
      };

      setSupportForm({
        mobileNumber: saved.mobileNumber ?? "",
        landlineNumber: saved.landlineNumber ?? "",
      });
      setSupportMessage("Support contact settings saved successfully.");
    } catch (err) {
      setSupportError(
        err instanceof Error ? err.message : "Failed to save support settings",
      );
    } finally {
      setSupportSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-blue-950 sm:text-3xl">
          Platform Settings
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800/80 sm:text-base">
          Manage analytics credentials and pricing controls from a single
          administrative workspace.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Configuration Areas
          </p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setActivePanel("ga4")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "ga4"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("pricing")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "pricing"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("support")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "support"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Support
            </button>
          </div>
        </aside>

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-500">Loading settings...</p>
          ) : activePanel === null ? (
            <p className="text-sm text-slate-500">
              Select any settings option from the left to start configuring.
            </p>
          ) : activePanel === "ga4" ? (
            <div className="grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                Analytics
              </p>
              <h2 className="text-xl font-semibold text-blue-950">
                Google Analytics 4
              </h2>
              <p className="text-sm text-blue-800/80">
                Configure the tracking property and service account used for
                executive reporting.
              </p>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Measurement ID
                </span>
                <input
                  value={formData.measurementId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      measurementId: e.target.value,
                    }))
                  }
                  placeholder="G-XXXXXXXXXX"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Property ID
                </span>
                <input
                  value={formData.propertyId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      propertyId: e.target.value,
                    }))
                  }
                  placeholder="123456789"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Service Account Email
                </span>
                <input
                  value={formData.serviceAccountEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      serviceAccountEmail: e.target.value,
                    }))
                  }
                  placeholder="analytics-reader@project.iam.gserviceaccount.com"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Service Account Private Key
                </span>
                <textarea
                  value={formData.serviceAccountPrivateKey}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      serviceAccountPrivateKey: e.target.value,
                    }))
                  }
                  placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                  className="min-h-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                {hasStoredPrivateKey && (
                  <p className="text-xs text-slate-500">
                    A private key is already saved. Leave this blank to keep it.
                  </p>
                )}
              </label>

              {message && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}
              {testMessage && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {testMessage}
                </p>
              )}
              {testError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {testError}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void handleTestConnection()}
                  disabled={testing}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-70"
                >
                  {testing ? "Testing..." : "Test Connection"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save GA4 Settings"}
                </button>
              </div>
            </div>
          ) : activePanel === "pricing" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                Pricing
              </p>
              <h2 className="mt-2 text-xl font-semibold text-blue-950">
                Service Charge Configuration
              </h2>
              <p className="mt-1 text-sm text-blue-800/80">
                Define the service charge percentage applied during booking
                total calculation.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 sm:max-w-sm">
                  <span className="text-xs font-semibold text-slate-600">
                    Service Charge Percent
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={pricingForm.serviceChargePercent}
                    onChange={(e) =>
                      setPricingForm((prev) => ({
                        ...prev,
                        serviceChargePercent: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>
              </div>

              {pricingMessage && (
                <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {pricingMessage}
                </p>
              )}
              {pricingError && (
                <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {pricingError}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handlePricingSave()}
                  disabled={pricingSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {pricingSaving ? "Saving..." : "Save Site Pricing"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                Support
              </p>
              <h2 className="mt-2 text-xl font-semibold text-blue-950">
                Customer Support Contacts
              </h2>
              <p className="mt-1 text-sm text-blue-800/80">
                Configure the single mobile and landline numbers shown in the
                live support panel across the site.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Mobile Number
                  </span>
                  <input
                    value={supportForm.mobileNumber}
                    onChange={(e) =>
                      setSupportForm((prev) => ({
                        ...prev,
                        mobileNumber: e.target.value,
                      }))
                    }
                    placeholder="+44 7933 837137"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Landline Number
                  </span>
                  <input
                    value={supportForm.landlineNumber}
                    onChange={(e) =>
                      setSupportForm((prev) => ({
                        ...prev,
                        landlineNumber: e.target.value,
                      }))
                    }
                    placeholder="+92 42 12345678"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>
              </div>

              {supportMessage && (
                <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {supportMessage}
                </p>
              )}
              {supportError && (
                <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {supportError}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSupportSave()}
                  disabled={supportSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {supportSaving ? "Saving..." : "Save Support Contacts"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
