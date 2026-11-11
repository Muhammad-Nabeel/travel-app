import {
    getActiveGoogleCredentials,
    getStoredGoogleAuthSettings,
    saveStoredGoogleAuthSettings,
} from "@/lib/admin-settings/google-auth-settings";
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

const CLIENT_ID = "123-abc.apps.googleusercontent.com";

beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(shouldBypassDatabase).mockReturnValue(false);
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
});

it("copies env credentials into the database on first read and enables Google", async () => {
    process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    findUnique.mockResolvedValue(null);

    await expect(getStoredGoogleAuthSettings()).resolves.toEqual({
        enabled: true,
        clientId: CLIENT_ID,
        clientSecret: "secret",
    });
    expect(createMany).toHaveBeenCalledWith({
        data: [{ key: "google_auth", value: `enc:${JSON.stringify({ enabled: true, clientId: CLIENT_ID, clientSecret: "secret" })}` }],
        skipDuplicates: true,
    });
});

it("stays disabled without env credentials", async () => {
    findUnique.mockResolvedValue(null);
    await expect(getActiveGoogleCredentials()).resolves.toBeNull();
});

it("returns no credentials when the admin turned Google off", async () => {
    findUnique.mockResolvedValue({
        value: `enc:${JSON.stringify({ enabled: false, clientId: CLIENT_ID, clientSecret: "s" })}`,
    } as never);
    await expect(getActiveGoogleCredentials()).resolves.toBeNull();
});

it("refuses to enable Google without a client secret", async () => {
    await expect(
        saveStoredGoogleAuthSettings({ enabled: true, clientId: CLIENT_ID, clientSecret: "" }),
    ).rejects.toThrow("Client Secret");
    expect(upsert).not.toHaveBeenCalled();
});
