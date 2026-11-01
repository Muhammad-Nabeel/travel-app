"use client";

import { useEffect, useState } from "react";

import type { SabreSettings } from "@/lib/admin-settings/sabre-settings";
import {
  SABRE_BASE_URL_PRESETS as BASE_URL_PRESETS,
  SUGGESTED_SABRE_FARE_CALENDAR_PATH,
  SUGGESTED_SABRE_FLIGHT_SEARCH_PATH,
  SUGGESTED_SABRE_VENDOR_CODES,
} from "@/lib/admin-settings/sabre-suggestions";

const ENDPOINT = "/api/admin/settings/sabre";

/** Suggested values for a first-time setup; the admin can change any of them. */
const SUGGESTED_FORM: SabreSettings = {
  enabled: false,
  baseUrl: BASE_URL_PRESETS[0].url,
  clientId: "",
  clientSecret: "",
  pseudoCityCode: "",
  cpaId: "",
  requestorCompanyCode: "TN",
  isoCountry: "PK",
  isoCurrency: "PKR",
  ndcEnabled: false,
  includeVendorCodes: [...SUGGESTED_SABRE_VENDOR_CODES],
  flightSearchPath: SUGGESTED_SABRE_FLIGHT_SEARCH_PATH,
  fareCalendarPath: SUGGESTED_SABRE_FARE_CALENDAR_PATH,
};

type TextField = Exclude<keyof SabreSettings, "enabled" | "ndcEnabled" | "includeVendorCodes">;

const FIELDS: { key: TextField; label: string; placeholder: string; hint?: string }[] = [
  { key: "clientId", label: "Client ID", placeholder: "V1:user:PCC:AA", hint: "From the Sabre Dev Studio application." },
  { key: "pseudoCityCode", label: "Pseudo City Code (PCC)", placeholder: "ABCD" },
  { key: "cpaId", label: "CPA ID", placeholder: "Usually the same as the Client ID" },
  { key: "requestorCompanyCode", label: "Requestor Company Code", placeholder: "TN" },
  { key: "isoCountry", label: "ISO Country", placeholder: "PK" },
  { key: "isoCurrency", label: "ISO Currency", placeholder: "PKR" },
  { key: "flightSearchPath", label: "Flight Search Endpoint", placeholder: SUGGESTED_SABRE_FLIGHT_SEARCH_PATH },
  { key: "fareCalendarPath", label: "Fare Calendar Endpoint", placeholder: SUGGESTED_SABRE_FARE_CALENDAR_PATH },
];

const INPUT_CLASS =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand";

/** Sabre flight provider: on/off switch and API credentials, stored encrypted in the database. */
export function SabreSettingsPanel() {
  const [form, setForm] = useState<SabreSettings>(SUGGESTED_FORM);
  // Kept as typed text so commas and spaces survive editing; split on save.
  const [vendorCodesText, setVendorCodesText] = useState(SUGGESTED_FORM.includeVendorCodes.join(", "));
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch(ENDPOINT, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as Omit<SabreSettings, "clientSecret"> & {
          hasClientSecret?: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Unable to load Sabre settings.");
        return json;
      })
      .then((loaded) => {
        if (ignore) return;
        setHasStoredSecret(Boolean(loaded.hasClientSecret));
        // Nothing saved yet: keep the suggested values so the admin only adds credentials.
        if (!loaded.clientId && !loaded.hasClientSecret) return;
        setForm({
          enabled: loaded.enabled,
          baseUrl: loaded.baseUrl,
          clientId: loaded.clientId,
          clientSecret: "",
          pseudoCityCode: loaded.pseudoCityCode,
          cpaId: loaded.cpaId,
          requestorCompanyCode: loaded.requestorCompanyCode,
          isoCountry: loaded.isoCountry,
          isoCurrency: loaded.isoCurrency,
          ndcEnabled: loaded.ndcEnabled,
          includeVendorCodes: loaded.includeVendorCodes,
          flightSearchPath: loaded.flightSearchPath,
          fareCalendarPath: loaded.fareCalendarPath,
        });
        setVendorCodesText(loaded.includeVendorCodes.join(", "));
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Unable to load Sabre settings.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  function updateClientId(clientId: string) {
    setForm((prev) => ({
      ...prev,
      clientId,
      // Sabre client IDs look like V1:user:PCC:AA, so suggest the PCC and CPA ID from it.
      pseudoCityCode: prev.pseudoCityCode || clientId.split(":")[2] || "",
      cpaId: prev.cpaId || clientId,
    }));
  }

  async function handleSave() {
    setBusy("save");
    setMessage("");
    setError("");
    try {
      const res = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, includeVendorCodes: vendorCodesText }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save Sabre settings.");

      if (form.clientSecret) setHasStoredSecret(true);
      setForm((prev) => ({ ...prev, clientSecret: "" }));
      setMessage(form.enabled ? "Saved. Live Sabre flight search is on." : "Saved. Live Sabre flight search is off.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Sabre settings.");
    } finally {
      setBusy(null);
    }
  }

  async function handleTest() {
    setBusy("test");
    setMessage("");
    setError("");
    try {
      const res = await fetch(`${ENDPOINT}?test=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, includeVendorCodes: vendorCodesText }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) throw new Error(json.message ?? "Sabre connection test failed.");
      setMessage(json.message ?? "Connected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sabre connection test failed.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading Sabre settings...</p>;
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Flight Provider</p>
        <h2 className="mt-2 text-xl font-semibold text-navy">Sabre</h2>
        <p className="mt-1 text-sm text-muted">
          Live flight search and the fare calendar use these credentials. While Sabre is off, flight
          search shows sample fares and the fare calendar shows no prices.
        </p>
      </div>

      <label className="flex items-center justify-between rounded-xl border border-line bg-subtle px-4 py-3">
        <span>
          <span className="block text-sm font-semibold text-navy">Enable live Sabre search</span>
          <span className="block text-xs text-muted">All credentials below are required to turn this on.</span>
        </span>
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
          className="h-5 w-5 rounded border-line-strong text-brand focus:ring-brand"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">API Base URL</span>
        <input
          value={form.baseUrl}
          onChange={(e) => setForm((prev) => ({ ...prev, baseUrl: e.target.value }))}
          placeholder={BASE_URL_PRESETS[0].url}
          className={INPUT_CLASS}
        />
        <span className="flex flex-wrap gap-2">
          {BASE_URL_PRESETS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, baseUrl: preset.url }))}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                form.baseUrl === preset.url
                  ? "border-brand bg-brand-soft text-brand-strong"
                  : "border-line bg-white text-navy/80 hover:bg-subtle"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">{field.label}</span>
            <input
              value={form[field.key]}
              onChange={(e) =>
                field.key === "clientId"
                  ? updateClientId(e.target.value)
                  : setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              placeholder={field.placeholder}
              className={INPUT_CLASS}
            />
            {field.hint && <span className="text-xs text-muted">{field.hint}</span>}
          </label>
        ))}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Client Secret</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.clientSecret}
            onChange={(e) => setForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
            placeholder={hasStoredSecret ? "Saved. Leave blank to keep it." : "Client secret"}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Airlines to Search</span>
        <textarea
          value={vendorCodesText}
          onChange={(e) => setVendorCodesText(e.target.value)}
          rows={3}
          placeholder="EK, QR, TK"
          className={INPUT_CLASS}
        />
        <span className="text-xs text-muted">Two-letter airline codes, separated by commas.</span>
      </label>

      <label className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2">
        <span>
          <span className="block text-sm font-medium text-navy/80">NDC content</span>
          <span className="block text-xs text-muted">Turn on only if the Sabre account is NDC-certified.</span>
        </span>
        <input
          type="checkbox"
          checked={form.ndcEnabled}
          onChange={(e) => setForm((prev) => ({ ...prev, ndcEnabled: e.target.checked }))}
          className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
        />
      </label>

      {message && <p className="rounded-lg bg-success/8 px-3 py-2 text-sm text-success">{message}</p>}
      {error && <p className="rounded-lg bg-deal/6 px-3 py-2 text-sm text-deal">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={busy !== null}
          className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-subtle disabled:opacity-70"
        >
          {busy === "test" ? "Testing..." : "Test Connection"}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy !== null}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
        >
          {busy === "save" ? "Saving..." : "Save Sabre Settings"}
        </button>
      </div>
    </div>
  );
}
