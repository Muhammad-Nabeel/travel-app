import type { SiteAnalyticsSettings } from "@/lib/admin-settings/ga4-settings";
import { ADS_CONVERSIONS, adsTagName } from "@/lib/analytics/gtm-plan";

import base from "./gtm-container-base.json";

type GtmParameter = { type: string; key: string; value?: string; list?: unknown[] };
type GtmTag = {
    accountId: string;
    containerId: string;
    tagId: string;
    name: string;
    type: string;
    parameter: GtmParameter[];
    firingTriggerId: string[];
    tagFiringOption: string;
    consentSettings?: { consentStatus: string };
};
type GtmVariable = { name: string; parameter?: GtmParameter[] };
type GtmExport = {
    exportFormatVersion: number;
    exportTime: string;
    containerVersion: {
        container: { publicId: string };
        tag: GtmTag[];
        variable: GtmVariable[];
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

/** GTM's built-in "All Pages" trigger. */
const ALL_PAGES_TRIGGER_ID = "2147479553";

const PLACEHOLDER_GTM_ID = "GTM-XXXXXXX";
const PLACEHOLDER_GA4_ID = "G-XXXXXXXXXX";

const text = (key: string, value: string): GtmParameter => ({ type: "TEMPLATE", key, value });
const flag = (key: string, value: boolean): GtmParameter => ({
    type: "BOOLEAN",
    key,
    value: String(value),
});

function tag(tagId: number, name: string, type: string, parameter: GtmParameter[], triggerId: string): GtmTag {
    return {
        accountId: "0",
        containerId: "0",
        tagId: String(tagId),
        name,
        type,
        parameter,
        firingTriggerId: [triggerId],
        tagFiringOption: "ONCE_PER_EVENT",
        consentSettings: { consentStatus: "NOT_SET" },
    };
}

function valueParameters(value: (typeof ADS_CONVERSIONS)[number]["value"]): GtmParameter[] {
    if (value === "booking") {
        return [
            text("conversionValue", "{{DLV - ecommerce.value}}"),
            text("currencyCode", "{{DLV - ecommerce.currency}}"),
            text("orderId", "{{DLV - ecommerce.transaction_id}}"),
        ];
    }
    if (value === "lead") {
        return [text("conversionValue", "{{DLV - value}}"), text("currencyCode", "{{DLV - currency}}")];
    }
    return [];
}

/**
 * Importable GTM container (Admin → Import Container) with the GA4 tags,
 * per-service triggers and, when configured, a Google Ads conversion tag per
 * service. Saved IDs replace the placeholders.
 */
export function buildGtmContainer(settings: SiteAnalyticsSettings, now = new Date()): GtmExport {
    const doc = structuredClone(base) as unknown as GtmExport;
    const version = doc.containerVersion;

    doc.exportTime = now.toISOString().slice(0, 19).replace("T", " ");
    version.container.publicId = settings.gtmContainerId || PLACEHOLDER_GTM_ID;

    const measurement = version.variable.find((v) => v.name === "GA4 Measurement ID");
    const valueParam = measurement?.parameter?.find((p) => p.key === "value");
    if (valueParam) valueParam.value = settings.measurementId || PLACEHOLDER_GA4_ID;

    const conversionId = settings.adsConversionId.replace(/^AW-/, "");
    const conversions = ADS_CONVERSIONS.filter((c) => settings.adsConversionLabels[c.key]);
    if (!conversionId || conversions.length === 0) return doc;

    let nextTagId = Math.max(...version.tag.map((t) => Number(t.tagId))) + 1;

    version.tag.push(
        tag(
            nextTagId++,
            "Conversion Linker",
            "gclidw",
            [flag("enableCrossDomain", false), flag("enableUrlPassthrough", false), flag("enableCookieOverrides", false)],
            ALL_PAGES_TRIGGER_ID,
        ),
    );

    for (const conversion of conversions) {
        version.tag.push(
            tag(
                nextTagId++,
                adsTagName(conversion.label),
                "awct",
                [
                    flag("enableNewCustomerReporting", false),
                    flag("enableConversionLinker", true),
                    flag("enableProductReporting", false),
                    flag("enableEnhancedConversion", false),
                    flag("enableShippingData", false),
                    flag("rdp", false),
                    text("conversionCookiePrefix", "_gcl"),
                    text("conversionId", conversionId),
                    text("conversionLabel", settings.adsConversionLabels[conversion.key]),
                    ...valueParameters(conversion.value),
                ],
                conversion.triggerId,
            ),
        );
    }

    return doc;
}
