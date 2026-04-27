"use client";

import { useEffect, useState } from "react";

const EMPTY_FORM = {
  provider: "ga4" as "ga4" | "gtm",
  gtmContainerId: "",
  measurementId: "",
  propertyId: "",
  serviceAccountEmail: "",
  serviceAccountPrivateKey: "",
};

const EMPTY_PRICING_FORM = {
  serviceChargePercent: "0",
};

const EMPTY_PAYMENT_FORM = {
  enableWise: true,
  enableStripe: true,
  enablePaypal: true,
  enableSumup: true,
  enablePaymob: true,
  enableCashOnDelivery: true,
  enablePayAtBranch: true,
};

const EMPTY_SUPPORT_FORM = {
  mobileNumber: "",
  landlineNumber: "",
};

const EMPTY_BRANCH_FORM = {
  name: "",
  city: "",
  address: "",
  phone: "",
  sortOrder: "0",
  isActive: true,
};

const GTM_EVENT_NAMES = [
  "flight_search_submitted",
  "proceed_to_payment",
  "payment_page_viewed",
  "payment_submitted",
] as const;

type PaymentSwitchKey = keyof typeof EMPTY_PAYMENT_FORM;

type BranchRow = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  sortOrder: number;
  isActive: boolean;
};

type SettingsPanel =
  | "ga4"
  | "pricing"
  | "payments"
  | "branches"
  | "support"
  | null;

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
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [wiseConfigured, setWiseConfigured] = useState(true);
  const [wiseMissingKeys, setWiseMissingKeys] = useState<string[]>([]);
  const [wiseWebhookSecretConfigured, setWiseWebhookSecretConfigured] =
    useState(false);
  const [wiseWebhookPath, setWiseWebhookPath] = useState(
    "/api/payments/wise/webhook",
  );
  const [supportForm, setSupportForm] = useState(EMPTY_SUPPORT_FORM);
  const [supportSaving, setSupportSaving] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportError, setSupportError] = useState("");
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH_FORM);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchMessage, setBranchMessage] = useState("");
  const [branchError, setBranchError] = useState("");
  const [copiedEventName, setCopiedEventName] = useState("");
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);

  async function handleCopyEventName(eventName: string) {
    try {
      await navigator.clipboard.writeText(eventName);
      setCopiedEventName(eventName);
      window.setTimeout(() => {
        setCopiedEventName("");
      }, 1200);
    } catch {
      setCopiedEventName("");
    }
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const [res, pricingRes, supportRes, branchRes] = await Promise.all([
          fetch("/api/admin/settings/ga4", {
            cache: "no-store",
          }),
          fetch("/api/admin/settings/site-pricing", {
            cache: "no-store",
          }),
          fetch("/api/admin/settings/support-contact", {
            cache: "no-store",
          }),
          fetch("/api/admin/settings/branches", {
            cache: "no-store",
          }),
        ]);

        const json = (await res.json()) as {
          provider?: "ga4" | "gtm";
          gtmContainerId?: string;
          measurementId?: string;
          propertyId?: string;
          serviceAccountEmail?: string;
          hasPrivateKey?: boolean;
        };

        setFormData({
          provider: json.provider === "gtm" ? "gtm" : "ga4",
          gtmContainerId: json.gtmContainerId ?? "",
          measurementId: json.measurementId ?? "",
          propertyId: json.propertyId ?? "",
          serviceAccountEmail: json.serviceAccountEmail ?? "",
          serviceAccountPrivateKey: "",
        });
        setHasStoredPrivateKey(Boolean(json.hasPrivateKey));

        const pricingJson = (await pricingRes.json()) as {
          serviceChargePercent?: number;
          enableWise?: boolean;
          enableStripe?: boolean;
          enablePaypal?: boolean;
          enableSumup?: boolean;
          enablePaymob?: boolean;
          enableCashOnDelivery?: boolean;
          enablePayAtBranch?: boolean;
          wiseConfigured?: boolean;
          wiseMissingKeys?: string[];
          wiseWebhookSecretConfigured?: boolean;
          wiseWebhookPath?: string;
        };

        const supportJson = (await supportRes.json()) as {
          mobileNumber?: string;
          landlineNumber?: string;
        };

        const branchJson = (await branchRes.json()) as {
          branches?: BranchRow[];
        };

        setPricingForm({
          serviceChargePercent: String(pricingJson.serviceChargePercent ?? 0),
        });
        setPaymentForm({
          enableWise: pricingJson.enableWise ?? true,
          enableStripe: pricingJson.enableStripe ?? true,
          enablePaypal: pricingJson.enablePaypal ?? true,
          enableSumup: pricingJson.enableSumup ?? true,
          enablePaymob: pricingJson.enablePaymob ?? true,
          enableCashOnDelivery: pricingJson.enableCashOnDelivery ?? true,
          enablePayAtBranch: pricingJson.enablePayAtBranch ?? true,
        });
        setWiseConfigured(Boolean(pricingJson.wiseConfigured ?? false));
        setWiseMissingKeys(
          Array.isArray(pricingJson.wiseMissingKeys)
            ? pricingJson.wiseMissingKeys
            : [],
        );
        setWiseWebhookSecretConfigured(
          Boolean(pricingJson.wiseWebhookSecretConfigured),
        );
        setWiseWebhookPath(
          pricingJson.wiseWebhookPath ?? "/api/payments/wise/webhook",
        );
        setSupportForm({
          mobileNumber: supportJson.mobileNumber ?? "",
          landlineNumber: supportJson.landlineNumber ?? "",
        });
        setBranches(
          Array.isArray(branchJson.branches) ? branchJson.branches : [],
        );
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

      setMessage(
        formData.provider === "gtm"
          ? "Google Tag Manager settings saved successfully."
          : "GA4 settings saved successfully.",
      );
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
    if (formData.provider === "gtm") {
      setTestError("");
      setTestMessage(
        "Google Tag Manager selected. Event delivery depends on your GTM container tags.",
      );
      return;
    }

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
          enableWise: paymentForm.enableWise,
          enableStripe: paymentForm.enableStripe,
          enablePaypal: paymentForm.enablePaypal,
          enableSumup: paymentForm.enableSumup,
          enablePaymob: paymentForm.enablePaymob,
          enableCashOnDelivery: paymentForm.enableCashOnDelivery,
          enablePayAtBranch: paymentForm.enablePayAtBranch,
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

  async function handlePaymentSave() {
    setPaymentSaving(true);
    setPaymentMessage("");
    setPaymentError("");

    try {
      const res = await fetch("/api/admin/settings/site-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceChargePercent: Number(pricingForm.serviceChargePercent || 0),
          enableWise: paymentForm.enableWise,
          enableStripe: paymentForm.enableStripe,
          enablePaypal: paymentForm.enablePaypal,
          enableSumup: paymentForm.enableSumup,
          enablePaymob: paymentForm.enablePaymob,
          enableCashOnDelivery: paymentForm.enableCashOnDelivery,
          enablePayAtBranch: paymentForm.enablePayAtBranch,
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to save payment settings");
      }

      setPaymentMessage("Payment method settings saved successfully.");
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Failed to save payment settings",
      );
    } finally {
      setPaymentSaving(false);
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

  function startEditBranch(branch: BranchRow) {
    setEditingBranchId(branch.id);
    setBranchForm({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone ?? "",
      sortOrder: String(branch.sortOrder),
      isActive: branch.isActive,
    });
    setBranchMessage("");
    setBranchError("");
  }

  function resetBranchForm() {
    setEditingBranchId(null);
    setBranchForm(EMPTY_BRANCH_FORM);
  }

  async function handleBranchSave() {
    setBranchSaving(true);
    setBranchMessage("");
    setBranchError("");

    try {
      const endpoint = editingBranchId
        ? `/api/admin/settings/branches/${editingBranchId}`
        : "/api/admin/settings/branches";
      const method = editingBranchId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: branchForm.name,
          city: branchForm.city,
          address: branchForm.address,
          phone: branchForm.phone,
          sortOrder: Number(branchForm.sortOrder || 0),
          isActive: branchForm.isActive,
        }),
      });

      const json = (await res.json()) as { error?: string } & BranchRow;
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save branch");
      }

      if (editingBranchId) {
        setBranches((prev) =>
          prev
            .map((item) => (item.id === json.id ? json : item))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        );
      } else {
        setBranches((prev) =>
          [...prev, json].sort((a, b) => a.sortOrder - b.sortOrder),
        );
      }

      setBranchMessage(
        editingBranchId
          ? "Branch updated successfully."
          : "Branch created successfully.",
      );
      resetBranchForm();
    } catch (err) {
      setBranchError(
        err instanceof Error ? err.message : "Failed to save branch",
      );
    } finally {
      setBranchSaving(false);
    }
  }

  async function handleBranchDelete(id: string) {
    setBranchMessage("");
    setBranchError("");

    try {
      const res = await fetch(`/api/admin/settings/branches/${id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete branch");
      }

      setBranches((prev) => prev.filter((item) => item.id !== id));
      if (editingBranchId === id) {
        resetBranchForm();
      }
      setBranchMessage("Branch deleted successfully.");
    } catch (err) {
      setBranchError(
        err instanceof Error ? err.message : "Failed to delete branch",
      );
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
              onClick={() => setActivePanel("payments")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "payments"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Payments
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("branches")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "branches"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Branches
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
                Tracking Provider
              </h2>
              <p className="text-sm text-blue-800/80">
                Choose GA4 or Google Tag Manager. The selected provider is used
                across public pages including flights, hotels, and payment.
              </p>

              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="provider"
                    checked={formData.provider === "ga4"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        provider: "ga4",
                      }))
                    }
                    className="h-4 w-4 border-slate-300 text-blue-600"
                  />
                  Google Analytics 4
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="provider"
                    checked={formData.provider === "gtm"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        provider: "gtm",
                      }))
                    }
                    className="h-4 w-4 border-slate-300 text-blue-600"
                  />
                  Google Tag Manager
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  GTM Container ID
                </span>
                <input
                  value={formData.gtmContainerId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gtmContainerId: e.target.value,
                    }))
                  }
                  placeholder="GTM-XXXXXXX"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                <p className="text-xs text-slate-500">
                  Required when provider is Google Tag Manager.
                </p>
              </label>

              {formData.provider === "gtm" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-700">
                    GTM Setup Guide
                  </p>
                  <p className="mt-2 text-sm text-amber-900">
                    After saving, create Custom Event triggers in GTM using the
                    exact event names below, then attach GA4 Event tags.
                  </p>
                  <div className="mt-3 space-y-2">
                    {GTM_EVENT_NAMES.map((eventName) => (
                      <div
                        key={eventName}
                        className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
                      >
                        <p className="text-sm font-medium text-amber-900">
                          {eventName}
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleCopyEventName(eventName)}
                          className="rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-200"
                        >
                          {copiedEventName === eventName ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-amber-800">
                    Recommended in GTM: one trigger + one GA4 Event tag per
                    event name, then publish the container.
                  </p>
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Measurement ID
                </span>
                <input
                  value={formData.measurementId}
                  disabled={formData.provider !== "ga4"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      measurementId: e.target.value,
                    }))
                  }
                  placeholder="G-XXXXXXXXXX"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Property ID
                </span>
                <input
                  value={formData.propertyId}
                  disabled={formData.provider !== "ga4"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      propertyId: e.target.value,
                    }))
                  }
                  placeholder="123456789"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Service Account Email
                </span>
                <input
                  value={formData.serviceAccountEmail}
                  disabled={formData.provider !== "ga4"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      serviceAccountEmail: e.target.value,
                    }))
                  }
                  placeholder="analytics-reader@project.iam.gserviceaccount.com"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Service Account Private Key
                </span>
                <textarea
                  value={formData.serviceAccountPrivateKey}
                  disabled={formData.provider !== "ga4"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      serviceAccountPrivateKey: e.target.value,
                    }))
                  }
                  placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                  className="min-h-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
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
                  disabled={testing || formData.provider !== "ga4"}
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
                  {saving ? "Saving..." : "Save Analytics Settings"}
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
          ) : activePanel === "payments" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                Payments
              </p>
              <h2 className="mt-2 text-xl font-semibold text-blue-950">
                Payment Method Availability
              </h2>
              <p className="mt-1 text-sm text-blue-800/80">
                Turn payment options on or off for checkout, including Cash on
                Delivery and Pay at Branch.
              </p>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "enableCashOnDelivery", label: "Cash on Delivery" },
                    { key: "enablePayAtBranch", label: "Pay at Branch" },
                    { key: "enableWise", label: "Wise" },
                    { key: "enableStripe", label: "Stripe" },
                    { key: "enablePaypal", label: "PayPal" },
                    { key: "enableSumup", label: "SumUp" },
                    { key: "enablePaymob", label: "Paymob" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={paymentForm[item.key as PaymentSwitchKey]}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {paymentForm.enableWise && !wiseConfigured && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Wise is enabled but not fully configured in `.env`. Missing:
                  {" "}
                  {wiseMissingKeys.length > 0
                    ? wiseMissingKeys.join(", ")
                    : "WISE_* credentials"}
                </p>
              )}
              {paymentForm.enableWise && (
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-xs text-blue-900">
                  <p className="font-semibold">Wise Webhook Setup</p>
                  <p className="mt-1">
                    Configure Wise webhook URL to:
                    {" "}
                    <code>{wiseWebhookPath}</code>
                  </p>
                  <p className="mt-1">
                    Set
                    {" "}
                    <code>WISE_WEBHOOK_SECRET</code>
                    {" "}
                    in `.env` and use the same secret in Wise dashboard.
                  </p>
                  <p className="mt-1">
                    Webhook secret status:
                    {" "}
                    {wiseWebhookSecretConfigured ? "Configured" : "Missing"}
                  </p>
                </div>
              )}

              {paymentMessage && (
                <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {paymentMessage}
                </p>
              )}
              {paymentError && (
                <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {paymentError}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handlePaymentSave()}
                  disabled={paymentSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {paymentSaving ? "Saving..." : "Save Payment Methods"}
                </button>
              </div>
            </div>
          ) : activePanel === "branches" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                Branches
              </p>
              <h2 className="mt-2 text-xl font-semibold text-blue-950">
                Branch Locations
              </h2>
              <p className="mt-1 text-sm text-blue-800/80">
                Manage branch options shown in the Pay at Branch checkout flow.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Name
                  </span>
                  <input
                    value={branchForm.name}
                    onChange={(e) =>
                      setBranchForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Main Branch"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    City
                  </span>
                  <input
                    value={branchForm.city}
                    onChange={(e) =>
                      setBranchForm((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="Lahore"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Address
                  </span>
                  <textarea
                    rows={3}
                    value={branchForm.address}
                    onChange={(e) =>
                      setBranchForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Full branch address"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Phone
                  </span>
                  <input
                    value={branchForm.phone}
                    onChange={(e) =>
                      setBranchForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+92 ..."
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Sort Order
                  </span>
                  <input
                    type="number"
                    value={branchForm.sortOrder}
                    onChange={(e) =>
                      setBranchForm((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={branchForm.isActive}
                    onChange={(e) =>
                      setBranchForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Active branch
                </label>
              </div>

              {branchMessage && (
                <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {branchMessage}
                </p>
              )}
              {branchError && (
                <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {branchError}
                </p>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {editingBranchId && (
                  <button
                    type="button"
                    onClick={resetBranchForm}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleBranchSave()}
                  disabled={branchSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {branchSaving
                    ? "Saving..."
                    : editingBranchId
                      ? "Update Branch"
                      : "Add Branch"}
                </button>
              </div>

              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">
                        City
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {branches.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-slate-500"
                        >
                          No branches configured yet.
                        </td>
                      </tr>
                    ) : (
                      branches.map((branch) => (
                        <tr key={branch.id}>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-800">
                              {branch.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {branch.phone ?? "No phone"}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {branch.city}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {branch.isActive ? "Active" : "Inactive"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditBranch(branch)}
                                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleBranchDelete(branch.id)
                                }
                                className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
