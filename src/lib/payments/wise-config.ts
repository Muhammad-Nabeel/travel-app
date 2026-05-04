type WiseEnvironment = "sandbox" | "live";

const REQUIRED_WISE_ENV_KEYS = [
    "WISE_API_TOKEN",
    "WISE_PROFILE_ID",
    "WISE_ACCOUNT_ID",
    "WISE_CHECKOUT_URL",
] as const;

function readEnv(key: string): string {
    return process.env[key]?.trim() ?? "";
}

function isHttpUrl(value: string): boolean {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
}

export type WiseRuntimeStatus = {
    configured: boolean;
    environment: WiseEnvironment;
    checkoutUrl: string | null;
    missingKeys: string[];
    webhookSecretConfigured: boolean;
    webhookPath: string;
};

export function getWiseRuntimeStatus(): WiseRuntimeStatus {
    const environment =
        readEnv("WISE_ENVIRONMENT").toLowerCase() === "sandbox"
            ? "sandbox"
            : "live";

    const checkoutUrlRaw = readEnv("WISE_CHECKOUT_URL");
    const checkoutUrl = isHttpUrl(checkoutUrlRaw) ? checkoutUrlRaw : null;
    const missingKeys = REQUIRED_WISE_ENV_KEYS.filter((key) => {
        if (key === "WISE_CHECKOUT_URL") {
            return !checkoutUrl;
        }
        return readEnv(key).length === 0;
    });
    const webhookSecretConfigured = readEnv("WISE_WEBHOOK_SECRET").length > 0;

    return {
        configured: missingKeys.length === 0,
        environment,
        checkoutUrl,
        missingKeys,
        webhookSecretConfigured,
        webhookPath: "/api/payments/wise/webhook",
    };
}
