"use client";

import { useEffect, useState } from "react";

import { BrandSettingsPanel } from "@/components/admin/brand-settings-panel";
import { SabreSettingsPanel } from "@/components/admin/sabre-settings-panel";

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
  email: "",
  mobileNumber: "",
  landlineNumber: "",
  whatsappNumber: "",
  address: "",
};

const EMPTY_BRANCH_FORM = {
  name: "",
  city: "",
  address: "",
  phone: "",
  sortOrder: "0",
  isActive: true,
};

const EMPTY_CURRENCY_FORM = {
  currencySelectorEnabled: true,
  defaultCurrency: "PKR",
  availableCurrencies: ["PKR", "USD", "EUR", "GBP", "SAR", "AED", "JPY"],
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
  | "brand"
  | "ga4"
  | "pricing"
  | "payments"
  | "branches"
  | "support"
  | "currency"
  | "sabre"
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
  const [currencyForm, setCurrencyForm] = useState(EMPTY_CURRENCY_FORM);
  const [currencySaving, setCurrencySaving] = useState(false);
  const [currencyMessage, setCurrencyMessage] = useState("");
  const [currencyError, setCurrencyError] = useState("");

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
        const [res, pricingRes, supportRes, branchRes, currencyRes] = await Promise.all([
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
          fetch("/api/admin/settings/currency", {
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
        };

        const supportJson = (await supportRes.json()) as Partial<
          typeof EMPTY_SUPPORT_FORM
        >;

        const branchJson = (await branchRes.json()) as {
          branches?: BranchRow[];
        };

        const currencyJson = (await currencyRes.json()) as {
          currencySelectorEnabled?: boolean;
          defaultCurrency?: string;
          availableCurrencies?: string[];
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
        setSupportForm({ ...EMPTY_SUPPORT_FORM, ...supportJson });
        setBranches(
          Array.isArray(branchJson.branches) ? branchJson.branches : [],
        );
        setCurrencyForm({
          currencySelectorEnabled: currencyJson.currencySelectorEnabled ?? true,
          defaultCurrency: currencyJson.defaultCurrency ?? "PKR",
          availableCurrencies: currencyJson.availableCurrencies ?? ["PKR", "USD", "EUR", "GBP", "SAR", "AED"],
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

      const saved = (await res.json()) as Partial<typeof EMPTY_SUPPORT_FORM>;

      setSupportForm({ ...EMPTY_SUPPORT_FORM, ...saved });
      setSupportMessage("Contact details saved successfully.");
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

  async function handleCurrencySave() {
    setCurrencySaving(true);
    setCurrencyMessage("");
    setCurrencyError("");

    try {
      const res = await fetch("/api/admin/settings/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currencyForm),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to save currency settings");
      }

      setCurrencyMessage("Currency settings saved successfully.");
    } catch (err) {
      setCurrencyError(err instanceof Error ? err.message : "Failed to save currency settings");
    } finally {
      setCurrencySaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-navy">
          Platform Settings
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Manage analytics credentials and pricing controls from a single
          administrative workspace.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Configuration Areas
          </p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setActivePanel("brand")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "brand"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Brand
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("ga4")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "ga4"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("pricing")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "pricing"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("payments")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "payments"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Payments
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("branches")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "branches"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Branches
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("support")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "support"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Contact Details
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("currency")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "currency"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Currency
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("sabre")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                activePanel === "sabre"
                  ? "border-line bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              Flight Provider (Sabre)
            </button>
          </div>
        </aside>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          {loading ? (
            <p className="text-sm text-muted">Loading settings...</p>
          ) : activePanel === null ? (
            <p className="text-sm text-muted">
              Select any settings option from the left to start configuring.
            </p>
          ) : activePanel === "brand" ? (
            <BrandSettingsPanel />
          ) : activePanel === "sabre" ? (
            <SabreSettingsPanel />
          ) : activePanel === "ga4" ? (
            <div className="grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Analytics
              </p>
              <h2 className="text-xl font-semibold text-navy">
                Tracking Provider
              </h2>
              <p className="text-sm text-muted">
                Choose GA4 or Google Tag Manager. The selected provider is used
                across public pages including flights, hotels, and payment.
              </p>

              <div className="grid gap-2 rounded-xl border border-line bg-subtle p-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-navy/80">
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
                    className="h-4 w-4 border-line-strong text-brand"
                  />
                  Google Analytics 4
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-navy/80">
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
                    className="h-4 w-4 border-line-strong text-brand"
                  />
                  Google Tag Manager
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
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
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <p className="text-xs text-muted">
                  Required when provider is Google Tag Manager.
                </p>
              </label>

              {formData.provider === "gtm" && (
                <div className="rounded-xl border border-gold/30 bg-gold/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-strong">
                    GTM Setup Guide
                  </p>
                  <p className="mt-2 text-sm text-gold-strong">
                    After saving, create Custom Event triggers in GTM using the
                    exact event names below, then attach GA4 Event tags.
                  </p>
                  <div className="mt-3 space-y-2">
                    {GTM_EVENT_NAMES.map((eventName) => (
                      <div
                        key={eventName}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-white px-3 py-2"
                      >
                        <p className="text-sm font-medium text-gold-strong">
                          {eventName}
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleCopyEventName(eventName)}
                          className="rounded-md border border-gold/40 bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-strong transition hover:bg-gold/25"
                        >
                          {copiedEventName === eventName ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gold-strong">
                    Recommended in GTM: one trigger + one GA4 Event tag per
                    event name, then publish the container.
                  </p>
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
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
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-line/50 disabled:text-muted/70"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
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
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-line/50 disabled:text-muted/70"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
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
                  className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-line/50 disabled:text-muted/70"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">
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
                  className="min-h-40 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-line/50 disabled:text-muted/70"
                />
                {hasStoredPrivateKey && (
                  <p className="text-xs text-muted">
                    A private key is already saved. Leave this blank to keep it.
                  </p>
                )}
              </label>

              {message && (
                <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">
                  {message}
                </p>
              )}
              {error && (
                <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">
                  {error}
                </p>
              )}
              {testMessage && (
                <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">
                  {testMessage}
                </p>
              )}
              {testError && (
                <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">
                  {testError}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void handleTestConnection()}
                  disabled={testing || formData.provider !== "ga4"}
                  className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft disabled:opacity-70"
                >
                  {testing ? "Testing..." : "Test Connection"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Analytics Settings"}
                </button>
              </div>
            </div>
          ) : activePanel === "pricing" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Pricing
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy">
                Service Charge Configuration
              </h2>
              <p className="mt-1 text-sm text-muted">
                Define the service charge percentage applied during booking
                total calculation.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 sm:max-w-sm">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>
              </div>

              {pricingMessage && (
                <p className="mt-4 rounded-lg bg-success/8 px-3 py-2 text-sm text-success">
                  {pricingMessage}
                </p>
              )}
              {pricingError && (
                <p className="mt-4 rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">
                  {pricingError}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handlePricingSave()}
                  disabled={pricingSaving}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
                >
                  {pricingSaving ? "Saving..." : "Save Site Pricing"}
                </button>
              </div>
            </div>
          ) : activePanel === "payments" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Payments
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy">
                Payment Method Availability
              </h2>
              <p className="mt-1 text-sm text-muted">
                Turn payment options on or off for checkout, including Cash on
                Delivery and Pay at Branch.
              </p>

              <div className="mt-4 rounded-lg border border-line bg-subtle px-4 py-3">
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
                      className="flex items-center justify-between rounded-md border border-line bg-white px-3 py-2"
                    >
                      <span className="text-sm font-medium text-navy/80">
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
                        className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {paymentMessage && (
                <p className="mt-4 rounded-lg bg-success/8 px-3 py-2 text-sm text-success">
                  {paymentMessage}
                </p>
              )}
              {paymentError && (
                <p className="mt-4 rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">
                  {paymentError}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handlePaymentSave()}
                  disabled={paymentSaving}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
                >
                  {paymentSaving ? "Saving..." : "Save Payment Methods"}
                </button>
              </div>
            </div>
          ) : activePanel === "branches" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Branches
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy">
                Branch Locations
              </h2>
              <p className="mt-1 text-sm text-muted">
                Manage branch options shown in the Pay at Branch checkout flow.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-navy/80 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={branchForm.isActive}
                    onChange={(e) =>
                      setBranchForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                  />
                  Active branch
                </label>
              </div>

              {branchMessage && (
                <p className="mt-4 rounded-lg bg-success/8 px-3 py-2 text-sm text-success">
                  {branchMessage}
                </p>
              )}
              {branchError && (
                <p className="mt-4 rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">
                  {branchError}
                </p>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {editingBranchId && (
                  <button
                    type="button"
                    onClick={resetBranchForm}
                    className="rounded-xl border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-navy/80 hover:bg-subtle"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleBranchSave()}
                  disabled={branchSaving}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
                >
                  {branchSaving
                    ? "Saving..."
                    : editingBranchId
                      ? "Update Branch"
                      : "Add Branch"}
                </button>
              </div>

              <div className="mt-5 overflow-x-auto rounded-xl border border-line">
                <table className="min-w-full divide-y divide-line text-sm">
                  <thead className="bg-subtle">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-muted">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted">
                        City
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-white">
                    {branches.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-muted"
                        >
                          No branches configured yet.
                        </td>
                      </tr>
                    ) : (
                      branches.map((branch) => (
                        <tr key={branch.id}>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-navy">
                              {branch.name}
                            </p>
                            <p className="text-xs text-muted">
                              {branch.phone ?? "No phone"}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-navy/80">
                            {branch.city}
                          </td>
                          <td className="px-3 py-2 text-navy/80">
                            {branch.isActive ? "Active" : "Inactive"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditBranch(branch)}
                                className="rounded-md border border-line px-2 py-1 text-xs font-semibold text-navy/80 hover:bg-subtle"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleBranchDelete(branch.id)
                                }
                                className="rounded-md border border-deal/20 px-2 py-1 text-xs font-semibold text-deal hover:bg-deal/6"
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
          ) : activePanel === "support" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Support
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy">
                Contact Details
              </h2>
              <p className="mt-1 text-sm text-muted">
                Shown on the Contact Us page, the footer, the Arrange a Call
                page and in search-engine business details.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Support Email
                  </span>
                  <input
                    type="email"
                    value={supportForm.email}
                    onChange={(e) =>
                      setSupportForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="support@easytrip.com.pk"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    WhatsApp Number
                  </span>
                  <input
                    value={supportForm.whatsappNumber}
                    onChange={(e) =>
                      setSupportForm((prev) => ({
                        ...prev,
                        whatsappNumber: e.target.value,
                      }))
                    }
                    placeholder="+92 300 1234567"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
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
                    placeholder="+92 300 1234567"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
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
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-muted">
                    Office Address
                  </span>
                  <input
                    value={supportForm.address}
                    onChange={(e) =>
                      setSupportForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Office address shown on the Contact Us page"
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </label>
              </div>

              {supportMessage && (
                <p className="mt-4 rounded-lg bg-success/8 px-3 py-2 text-sm text-success">
                  {supportMessage}
                </p>
              )}
              {supportError && (
                <p className="mt-4 rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">
                  {supportError}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSupportSave()}
                  disabled={supportSaving}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
                >
                  {supportSaving ? "Saving..." : "Save Contact Details"}
                </button>
              </div>
            </div>
          ) : activePanel === "currency" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Currency
              </p>
              <h2 className="mt-2 text-xl font-semibold text-navy">
                Currency Settings
              </h2>
              <p className="mt-1 text-sm text-muted">
                Configure currency selector for flight searches and set the default currency.
              </p>

              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={currencyForm.currencySelectorEnabled}
                    onChange={(e) =>
                      setCurrencyForm((prev) => ({
                        ...prev,
                        currencySelectorEnabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                  />
                  <div>
                    <span className="text-sm font-medium text-navy/80">
                      Enable Currency Selector
                    </span>
                    <p className="text-xs text-muted">
                      Allow users to select currency for flight searches in the navbar
                    </p>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">
                    Default Currency
                  </span>
                  <select
                    value={currencyForm.defaultCurrency}
                    onChange={(e) =>
                      setCurrencyForm((prev) => ({
                        ...prev,
                        defaultCurrency: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  >
                    {currencyForm.availableCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="text-xs font-semibold text-muted">
                    Available Currencies
                  </span>
                  <p className="text-xs text-muted mb-2">
                    Currencies users can select from
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {["PKR", "USD", "EUR", "GBP", "SAR", "AED"].map((currency) => (
                      <label key={currency} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={currencyForm.availableCurrencies.includes(currency)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCurrencyForm((prev) => ({
                              ...prev,
                              availableCurrencies: checked
                                ? [...prev.availableCurrencies, currency]
                                : prev.availableCurrencies.filter((c) => c !== currency),
                            }));
                          }}
                          className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-navy/80">{currency}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {currencyMessage && (
                <p className="mt-4 rounded-lg bg-success/8 px-3 py-2 text-sm text-success">
                  {currencyMessage}
                </p>
              )}
              {currencyError && (
                <p className="mt-4 rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">
                  {currencyError}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleCurrencySave()}
                  disabled={currencySaving}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
                >
                  {currencySaving ? "Saving..." : "Save Currency Settings"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
