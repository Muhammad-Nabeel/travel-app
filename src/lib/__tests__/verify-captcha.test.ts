/**
 * @jest-environment node
 */
import { getActiveCaptchaSettings } from "@/lib/admin-settings/captcha-settings";
import { verifyCaptcha } from "@/lib/captcha/verify-captcha";

jest.mock("@/lib/admin-settings/captcha-settings", () => ({
    getActiveCaptchaSettings: jest.fn(),
}));

const settings = { enabled: true, siteKey: "1x00000000000000000000AA", secretKey: "secret" };
const mockedSettings = getActiveCaptchaSettings as jest.Mock;
const fetchMock = jest.fn();

beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
});

beforeEach(() => {
    fetchMock.mockReset();
    mockedSettings.mockResolvedValue(settings);
});

function cloudflareSays(body: object) {
    fetchMock.mockResolvedValue({ json: async () => body });
}

describe("verifyCaptcha", () => {
    it("lets forms through when protection is off", async () => {
        mockedSettings.mockResolvedValue(null);
        await expect(verifyCaptcha(undefined, "1.1.1.1")).resolves.toBe("disabled");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects a missing token without calling Cloudflare", async () => {
        await expect(verifyCaptcha("", "1.1.1.1")).resolves.toBe("missing");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("passes a token Cloudflare accepts, sending secret and IP", async () => {
        cloudflareSays({ success: true });
        await expect(verifyCaptcha("tok", "1.1.1.1")).resolves.toBe("passed");
        const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
        expect(body.get("secret")).toBe("secret");
        expect(body.get("response")).toBe("tok");
        expect(body.get("remoteip")).toBe("1.1.1.1");
    });

    it("fails a token Cloudflare rejects", async () => {
        cloudflareSays({ success: false, "error-codes": ["invalid-input-response"] });
        await expect(verifyCaptcha("tok", "1.1.1.1")).resolves.toBe("failed");
    });

    it("reports unavailable when Cloudflare can't be reached", async () => {
        fetchMock.mockRejectedValue(new Error("network down"));
        jest.spyOn(console, "error").mockImplementation(() => {});
        await expect(verifyCaptcha("tok", "1.1.1.1")).resolves.toBe("unavailable");
    });
});
