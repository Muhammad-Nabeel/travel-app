/**
 * @jest-environment node
 */
import {
    getActiveCaptchaSettings,
    getPublicCaptchaSiteKey,
    getStoredCaptchaSettings,
    saveStoredCaptchaSettings,
} from "@/lib/admin-settings/captcha-settings";

// An in-memory AdminSetting table standing in for Postgres.
const rows = new Map<string, string>();

jest.mock("@/lib/db", () => ({
    shouldBypassDatabase: () => false,
    markDatabaseUnavailable: () => {},
    prisma: {
        adminSetting: {
            findUnique: async ({ where }: { where: { key: string } }) =>
                rows.has(where.key) ? { value: rows.get(where.key) } : null,
            upsert: async ({ where, create }: { where: { key: string }; create: { value: string } }) => {
                rows.set(where.key, create.value);
            },
        },
    },
}));

const KEYS = { siteKey: "0x4AAAAAAAexampleSiteKey", secretKey: "0x4AAAAAAAexampleSecretKey" };

beforeAll(() => {
    process.env.ADMIN_SETTINGS_ENCRYPTION_KEY = "test-encryption-key";
});

beforeEach(() => rows.clear());

describe("captcha settings (admin, stored in the database)", () => {
    it("is off until an admin saves keys, even if env vars exist", async () => {
        process.env.TURNSTILE_SITE_KEY = KEYS.siteKey;
        process.env.TURNSTILE_SECRET_KEY = KEYS.secretKey;
        await expect(getActiveCaptchaSettings()).resolves.toBeNull();
        await expect(getPublicCaptchaSiteKey()).resolves.toBeNull();
        expect(rows.size).toBe(0);
        delete process.env.TURNSTILE_SITE_KEY;
        delete process.env.TURNSTILE_SECRET_KEY;
    });

    it("saves the keys encrypted and enforces them once enabled", async () => {
        await saveStoredCaptchaSettings({ enabled: true, ...KEYS });

        const stored = [...rows.values()][0];
        expect(stored).not.toContain(KEYS.secretKey);
        expect(stored).not.toContain(KEYS.siteKey);

        await expect(getStoredCaptchaSettings()).resolves.toEqual({ enabled: true, ...KEYS });
        await expect(getPublicCaptchaSiteKey()).resolves.toBe(KEYS.siteKey);
    });

    it("keeps keys but stops enforcing when an admin switches it off", async () => {
        await saveStoredCaptchaSettings({ enabled: false, ...KEYS });
        await expect(getActiveCaptchaSettings()).resolves.toBeNull();
        await expect(getStoredCaptchaSettings()).resolves.toMatchObject(KEYS);
    });

    it("refuses to enable without both keys or with a malformed site key", async () => {
        await expect(
            saveStoredCaptchaSettings({ enabled: true, siteKey: KEYS.siteKey, secretKey: "" }),
        ).rejects.toThrow(/site key and secret key/);
        await expect(
            saveStoredCaptchaSettings({ enabled: true, siteKey: "not-a-key", secretKey: "x" }),
        ).rejects.toThrow(/must start with 0x/);
        expect(rows.size).toBe(0);
    });
});
