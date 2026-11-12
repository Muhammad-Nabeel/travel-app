import {
    getPublicAnalyticsConfig,
    getStoredDashboardAnalyticsSettings,
    getStoredSiteAnalyticsSettings,
    normalizeSiteAnalyticsSettings,
    saveStoredSiteAnalyticsSettings,
} from "@/lib/admin-settings/ga4-settings";
import { prisma, shouldBypassDatabase } from "@/lib/db";

jest.mock("@/lib/db", () => ({
    prisma: { adminSetting: { findUnique: jest.fn(), upsert: jest.fn(), createMany: jest.fn() } },
    shouldBypassDatabase: jest.fn(),
    markDatabaseUnavailable: jest.fn(),
}));
jest.mock("@/lib/admin-settings/encryption", () => ({
    encryptString: (value: string) => `enc:${value}`,
    decryptString: (value: string) => value.replace(/^enc:/, ""),
}));

const findUnique = jest.mocked(prisma.adminSetting.findUnique);
const upsert = jest.mocked(prisma.adminSetting.upsert);
const createMany = jest.mocked(prisma.adminSetting.createMany);

const LEGACY = {
    provider: "gtm",
    gtmContainerId: "GTM-ABC123",
    measurementId: "G-XYZ789",
    propertyId: "123456",
    serviceAccountEmail: "reader@x.iam.gserviceaccount.com",
    serviceAccountPrivateKey: "KEY",
};

function rows(map: Record<string, string>) {
    findUnique.mockImplementation((async ({ where }: { where: { key: string } }) =>
        where.key in map ? { value: map[where.key] } : null) as never);
}

beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(shouldBypassDatabase).mockReturnValue(false);
});

it("splits the legacy combined ga4 row into site and dashboard rows", async () => {
    rows({ ga4: `enc:${JSON.stringify(LEGACY)}` });

    const site = await getStoredSiteAnalyticsSettings();
    expect(site).toMatchObject({
        provider: "gtm",
        gtmContainerId: "GTM-ABC123",
        measurementId: "G-XYZ789",
        adsConversionId: "",
    });
    expect(createMany).toHaveBeenCalledWith({
        data: [
            {
                key: "site_analytics",
                value: JSON.stringify(site),
            },
            {
                key: "dashboard_analytics",
                value: `enc:${JSON.stringify({
                    propertyId: "123456",
                    serviceAccountEmail: "reader@x.iam.gserviceaccount.com",
                    serviceAccountPrivateKey: "KEY",
                })}`,
            },
        ],
        skipDuplicates: true,
    });
});

it("reads site and dashboard settings independently once split", async () => {
    rows({
        site_analytics: JSON.stringify({ provider: "ga4", gtmContainerId: "", measurementId: "G-SITE1" }),
        dashboard_analytics: `enc:${JSON.stringify({ propertyId: "999", serviceAccountEmail: "a@b.c", serviceAccountPrivateKey: "K" })}`,
        ga4: `enc:${JSON.stringify(LEGACY)}`,
    });

    await expect(getStoredSiteAnalyticsSettings()).resolves.toMatchObject({ measurementId: "G-SITE1" });
    await expect(getStoredDashboardAnalyticsSettings()).resolves.toMatchObject({ propertyId: "999" });
    await expect(getPublicAnalyticsConfig()).resolves.toEqual({ provider: "ga4", id: "G-SITE1" });
    expect(createMany).not.toHaveBeenCalled();
});

it("serves the site tag from the database even when env vars are set", async () => {
    process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER = "gtm";
    process.env.NEXT_PUBLIC_GTM_CONTAINER_ID = "GTM-ENV999";
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = "G-ENV999";
    try {
        rows({
            site_analytics: JSON.stringify({ provider: "gtm", gtmContainerId: "GTM-DB1", measurementId: "G-DB1" }),
        });
        await expect(getPublicAnalyticsConfig()).resolves.toEqual({ provider: "gtm", id: "GTM-DB1" });

        rows({});
        await expect(getPublicAnalyticsConfig()).resolves.toBeNull();
    } finally {
        delete process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
        delete process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
        delete process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    }
});

it("saving the site tag never touches dashboard credentials", async () => {
    await saveStoredSiteAnalyticsSettings(normalizeSiteAnalyticsSettings({ provider: "ga4", measurementId: "g-new1" }));

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0].where).toEqual({ key: "site_analytics" });
});

it("rejects malformed tag IDs", async () => {
    await expect(
        saveStoredSiteAnalyticsSettings(normalizeSiteAnalyticsSettings({ provider: "ga4", measurementId: "UA-1" })),
    ).rejects.toThrow("Measurement ID");
    expect(upsert).not.toHaveBeenCalled();
});

describe("buildGtmContainer", () => {
    // Imported lazily so the mocks above apply.
    const { buildGtmContainer } = jest.requireActual("@/lib/analytics/gtm-container") as typeof import("@/lib/analytics/gtm-container");

    const settings = normalizeSiteAnalyticsSettings({
        provider: "gtm",
        gtmContainerId: "GTM-ABC123",
        measurementId: "G-XYZ789",
    });

    it("fills the saved IDs into the container", () => {
        const doc = buildGtmContainer(settings);
        const version = doc.containerVersion;
        expect(version.container.publicId).toBe("GTM-ABC123");
        const constant = version.variable.find((v) => v.name === "GA4 Measurement ID");
        expect(constant?.parameter?.[0].value).toBe("G-XYZ789");
        expect(version.tag.some((t) => t.type === "awct")).toBe(false);
    });

    it("adds a Google Ads tag only for services with a label", () => {
        const doc = buildGtmContainer({
            ...settings,
            adsConversionId: "AW-111",
            adsConversionLabels: { ...settings.adsConversionLabels, hotelLead: "hotelLbl", flightBooking: "bookLbl" },
        });
        const tags = doc.containerVersion.tag;
        const ads = tags.filter((t) => t.type === "awct");

        expect(tags.filter((t) => t.type === "gclidw")).toHaveLength(1);
        expect(ads.map((t) => [t.name, t.firingTriggerId[0]])).toEqual([
            ["Ads - Flight booking", "109"],
            ["Ads - Hotel enquiry", "104"],
        ]);
        const booking = Object.fromEntries(ads[0].parameter.map((p) => [p.key, p.value]));
        expect(booking).toMatchObject({
            conversionId: "111",
            conversionLabel: "bookLbl",
            orderId: "{{DLV - ecommerce.transaction_id}}",
        });
        // Every trigger a tag points at exists in the container (or is built-in All Pages).
        const triggerIds = new Set([
            "2147479553",
            ...(doc.containerVersion.trigger as { triggerId: string }[]).map((t) => t.triggerId),
        ]);
        for (const t of tags) expect(triggerIds.has(t.firingTriggerId[0])).toBe(true);
    });
});
