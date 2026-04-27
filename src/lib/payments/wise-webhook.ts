import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type WiseWebhookOutcome = "success" | "failed" | "pending";

const SUCCESS_STATUSES = new Set([
    "COMPLETED",
    "SUCCESS",
    "SUCCEEDED",
    "OUTGOING_PAYMENT_SENT",
    "FUNDS_CONVERTED",
    "TRANSFER_COMPLETED",
]);

const FAILED_STATUSES = new Set([
    "FAILED",
    "CANCELLED",
    "CANCELED",
    "REJECTED",
    "EXPIRED",
    "ERROR",
]);

function getString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function getNestedString(record: Record<string, unknown>, path: string[]): string {
    let current: unknown = record;
    for (const key of path) {
        if (!current || typeof current !== "object" || Array.isArray(current)) {
            return "";
        }
        current = (current as Record<string, unknown>)[key];
    }
    return getString(current);
}

export function extractWiseBookingReference(payload: unknown): string {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return "";
    }

    const record = payload as Record<string, unknown>;
    const candidates = [
        getString(record.booking_reference),
        getString(record.bookingReference),
        getString(record.reference),
        getNestedString(record, ["metadata", "booking_reference"]),
        getNestedString(record, ["metadata", "bookingReference"]),
        getNestedString(record, ["data", "booking_reference"]),
        getNestedString(record, ["data", "bookingReference"]),
        getNestedString(record, ["resource", "reference"]),
    ];

    return candidates.find((value) => value.length > 0) ?? "";
}

export function extractWiseEventId(payload: unknown): string {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return "";
    }

    const record = payload as Record<string, unknown>;
    const candidates = [
        getString(record.id),
        getString(record.event_id),
        getString(record.eventId),
        getNestedString(record, ["data", "id"]),
    ];
    return candidates.find((value) => value.length > 0) ?? "";
}

export function getWiseWebhookOutcome(payload: unknown): WiseWebhookOutcome {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return "pending";
    }

    const record = payload as Record<string, unknown>;
    const rawStatus =
        getString(record.status) ||
        getString(record.current_status) ||
        getString(record.state) ||
        getNestedString(record, ["data", "status"]) ||
        getNestedString(record, ["resource", "status"]);
    const normalized = rawStatus.toUpperCase();

    if (SUCCESS_STATUSES.has(normalized)) {
        return "success";
    }
    if (FAILED_STATUSES.has(normalized)) {
        return "failed";
    }
    return "pending";
}

function constantTimeEquals(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    if (aBuffer.length !== bBuffer.length) return false;
    return timingSafeEqual(aBuffer, bBuffer);
}

function normalizeSignature(signature: string): string {
    if (!signature) return "";
    const trimmed = signature.trim();
    if (trimmed.startsWith("sha256=")) {
        return trimmed.slice("sha256=".length);
    }
    return trimmed;
}

export function verifyWiseWebhookSignature(input: {
    rawBody: string;
    signatureHeader: string;
    secret: string;
}): boolean {
    const signature = normalizeSignature(input.signatureHeader);
    if (!input.secret || !signature) {
        return false;
    }

    const digestHex = createHmac("sha256", input.secret)
        .update(input.rawBody)
        .digest("hex");
    const digestBase64 = createHmac("sha256", input.secret)
        .update(input.rawBody)
        .digest("base64");

    return (
        constantTimeEquals(signature, digestHex) ||
        constantTimeEquals(signature, digestBase64)
    );
}

export function createWiseEventFingerprint(rawBody: string): string {
    return createHash("sha256").update(rawBody).digest("hex");
}
