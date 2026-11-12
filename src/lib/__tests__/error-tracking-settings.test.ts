/**
 * @jest-environment node
 */
jest.mock("@/lib/db", () => ({ prisma: {}, shouldBypassDatabase: () => true, markDatabaseUnavailable: () => {} }));

import {
    normalizeErrorTrackingSettings,
    validateErrorTrackingSettings,
} from "@/lib/admin-settings/error-tracking-settings";

const DSN = "https://abc123def456@o123456.ingest.sentry.io/7890";

describe("error tracking settings", () => {
    it("accepts a Sentry DSN and clamps the trace rate", () => {
        const settings = normalizeErrorTrackingSettings({ enabled: true, dsn: ` ${DSN} `, tracesSampleRate: 5 });
        expect(settings).toEqual({ enabled: true, dsn: DSN, environment: "production", tracesSampleRate: 1 });
        expect(validateErrorTrackingSettings(settings)).toBeNull();
    });

    it("refuses to enable without a valid DSN", () => {
        expect(validateErrorTrackingSettings(normalizeErrorTrackingSettings({ enabled: true }))).toMatch(/Enter the Sentry DSN/);
        expect(
            validateErrorTrackingSettings(normalizeErrorTrackingSettings({ enabled: true, dsn: "http://not-a-dsn" })),
        ).toMatch(/should look like/);
    });

    it("allows saving while disabled with nothing filled in", () => {
        expect(validateErrorTrackingSettings(normalizeErrorTrackingSettings({}))).toBeNull();
    });
});
