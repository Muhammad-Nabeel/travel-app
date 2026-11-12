import { NextResponse, type NextRequest } from "next/server";

import { getActiveCaptchaSettings } from "@/lib/admin-settings/captcha-settings";
import { clientIp } from "@/lib/rate-limit";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;

export type CaptchaVerdict = "passed" | "disabled" | "missing" | "failed" | "unavailable";

/**
 * Checks a Turnstile token with Cloudflare. Tokens are single use and expire
 * after 5 minutes, so the browser widget is reset after every submission.
 *
 * If Cloudflare cannot be reached the verdict is "unavailable" and the form
 * is let through: losing a real customer's enquiry costs more than the brief
 * gap, and rate limits still apply.
 */
export async function verifyCaptcha(token: unknown, remoteIp: string): Promise<CaptchaVerdict> {
    const settings = await getActiveCaptchaSettings();
    if (!settings) return "disabled";
    if (typeof token !== "string" || !token || token.length > 2048) return "missing";

    const form = new URLSearchParams({ secret: settings.secretKey, response: token });
    if (remoteIp !== "unknown") form.set("remoteip", remoteIp);

    try {
        const res = await fetch(SITEVERIFY_URL, {
            method: "POST",
            body: form,
            signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
            cache: "no-store",
        });
        const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
        if (json.success) return "passed";

        // A wrong secret is a setup problem, not a bot: say so in the log.
        const codes = json["error-codes"] ?? [];
        if (codes.includes("invalid-input-secret")) {
            console.error("[captcha] Turnstile secret key is invalid; check Admin → Settings → Form Protection.");
        }
        return "failed";
    } catch (error) {
        console.error("[captcha] Turnstile verification unavailable:", error);
        return "unavailable";
    }
}

/**
 * For route handlers: null when the request may continue, otherwise the
 * 400 response to return.
 */
export async function rejectWithoutCaptcha(
    request: NextRequest,
    token: unknown,
): Promise<NextResponse | null> {
    const verdict = await verifyCaptcha(token, clientIp(request.headers));
    if (verdict === "passed" || verdict === "disabled" || verdict === "unavailable") {
        return null;
    }

    return NextResponse.json(
        {
            ok: false,
            error:
                verdict === "missing"
                    ? "Please complete the security check and try again. If you don't see it, refresh the page."
                    : "The security check failed or expired. Please try again.",
            captcha: true,
        },
        { status: 400 },
    );
}
