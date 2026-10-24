import {
    defaultCurrencySettings,
    getStoredCurrencySettings,
    saveStoredCurrencySettings,
} from "@/lib/admin-settings/currency-settings";
import { markDatabaseUnavailable, prisma, shouldBypassDatabase } from "@/lib/db";

jest.mock("@/lib/db", () => ({
    prisma: { adminSetting: { findUnique: jest.fn(), upsert: jest.fn() } },
    shouldBypassDatabase: jest.fn(),
    markDatabaseUnavailable: jest.fn(),
}));

const findUnique = jest.mocked(prisma.adminSetting.findUnique);
const upsert = jest.mocked(prisma.adminSetting.upsert);

beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(shouldBypassDatabase).mockReturnValue(false);
});

it("loads saved currency preferences from the database text field", async () => {
    const settings = { ...defaultCurrencySettings(), defaultCurrency: "USD" };
    findUnique.mockResolvedValue({ value: JSON.stringify(settings) } as never);

    await expect(getStoredCurrencySettings()).resolves.toEqual(settings);
});

it("saves currency preferences as JSON text", async () => {
    const settings = { ...defaultCurrencySettings(), defaultCurrency: "EUR" };
    await saveStoredCurrencySettings(settings);

    expect(upsert).toHaveBeenCalledWith({
        where: { key: "currency_settings" },
        update: { value: JSON.stringify(settings) },
        create: { key: "currency_settings", value: JSON.stringify(settings) },
    });
});

it("returns defaults and records database failures", async () => {
    const error = new Error("connection timeout");
    findUnique.mockRejectedValue(error);

    await expect(getStoredCurrencySettings()).resolves.toEqual(defaultCurrencySettings());
    expect(markDatabaseUnavailable).toHaveBeenCalledWith(error);
});

it("rejects saves when the database is unavailable", async () => {
    jest.mocked(shouldBypassDatabase).mockReturnValue(true);

    await expect(saveStoredCurrencySettings(defaultCurrencySettings())).rejects.toThrow(
        "Database is not available",
    );
    expect(upsert).not.toHaveBeenCalled();
});
