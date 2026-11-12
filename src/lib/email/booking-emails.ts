import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import { getStoredSupportContactSettings, getPrimaryPhone } from "@/lib/admin-settings/support-contact-settings";
import { sendMail } from "@/lib/email/mailer";
import { buildBookingClaimUrl } from "@/lib/bookings/link-user";
import { absoluteUrl } from "@/lib/seo";

export type BookingEmailDetails = {
    bookingId: string;
    reference: string;
    /** e.g. "Flight booking request", "Umrah enquiry". */
    kind: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    /** Label/value rows describing the trip, shown to both parties. */
    summary: Array<[string, string]>;
    total?: { amount: number; currency: string } | null;
    /** Made without signing in: the receipt offers a link to add it to an account. */
    isGuest: boolean;
};

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatMoney(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
    }
}

function rowsHtml(rows: Array<[string, string]>) {
    return rows
        .map(
            ([label, value]) =>
                `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">${escapeHtml(label)}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`,
        )
        .join("");
}

function layout(body: string) {
    return `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:560px;">${body}</div>`;
}

/**
 * Sends the customer a receipt for their request and alerts the agency.
 * Never throws: a mail failure must not undo a booking that is already saved.
 */
export async function sendBookingRequestEmails(details: BookingEmailDetails): Promise<void> {
    try {
        const [{ name: brandName }, contact] = await Promise.all([
            getStoredBrandSettings(),
            getStoredSupportContactSettings(),
        ]);

        const rows: Array<[string, string]> = [
            ["Reference", details.reference],
            ...details.summary,
            ...(details.total
                ? ([["Estimated total", formatMoney(details.total.amount, details.total.currency)]] as Array<[string, string]>)
                : []),
        ];
        const phone = getPrimaryPhone(contact);

        const jobs: Promise<void>[] = [];

        if (details.customerEmail) {
            const claimHtml = details.isGuest
                ? `<p><a href="${escapeHtml(buildBookingClaimUrl(details.bookingId, details.customerEmail))}">Add this booking to my account</a> to track it from your dashboard (sign in or create an account with this email first).</p>`
                : "";
            jobs.push(
                sendMail({
                    to: details.customerEmail,
                    replyTo: contact.email || undefined,
                    subject: `We've received your request ${details.reference}`,
                    html: layout(`
                        <h2 style="margin:0 0 12px;">Thank you${details.customerName ? `, ${escapeHtml(details.customerName)}` : ""}</h2>
                        <p>We've received your ${escapeHtml(details.kind.toLowerCase())}. A travel adviser will contact you shortly to confirm availability, the final price and payment.</p>
                        <table style="border-collapse:collapse;margin:16px 0;">${rowsHtml(rows)}</table>
                        ${claimHtml}
                        <p>Please quote <strong>${escapeHtml(details.reference)}</strong> if you contact us${phone ? ` on ${escapeHtml(phone)}` : ""}${contact.email ? ` or at ${escapeHtml(contact.email)}` : ""}.</p>
                        <p style="color:#6b7280;">${escapeHtml(brandName)}</p>
                    `),
                }),
            );
        }

        if (contact.email) {
            const customerRows: Array<[string, string]> = [
                ["Name", details.customerName ?? "—"],
                ["Email", details.customerEmail ?? "—"],
                ["Phone", details.customerPhone ?? "—"],
            ];
            jobs.push(
                sendMail({
                    to: contact.email,
                    replyTo: details.customerEmail ?? undefined,
                    subject: `New ${details.kind.toLowerCase()} ${details.reference}`,
                    html: layout(`
                        <h2 style="margin:0 0 12px;">New ${escapeHtml(details.kind.toLowerCase())}</h2>
                        <table style="border-collapse:collapse;margin:16px 0;">${rowsHtml([...rows, ...customerRows])}</table>
                        <p><a href="${escapeHtml(absoluteUrl(`/admin/bookings/${details.bookingId}`))}">Open in admin</a></p>
                    `),
                }),
            );
        }

        const results = await Promise.allSettled(jobs);
        for (const result of results) {
            if (result.status === "rejected") {
                console.error(`[booking-email] ${details.reference}:`, result.reason);
            }
        }
    } catch (error) {
        console.error(`[booking-email] ${details.reference}:`, error);
    }
}
