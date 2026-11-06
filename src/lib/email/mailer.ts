import nodemailer from "nodemailer";

import {
    getStoredSmtpSettings,
    missingSmtpFields,
    type SmtpSettings,
} from "@/lib/admin-settings/smtp-settings";

export type MailMessage = {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
};

function createTransport(settings: SmtpSettings) {
    return nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        // Port 587 servers expect STARTTLS; refuse to send credentials in clear text.
        requireTLS: !settings.secure,
        auth: { user: settings.username, pass: settings.password },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
    });
}

function fromAddress(settings: SmtpSettings) {
    return { name: settings.fromName, address: settings.fromEmail };
}

/** Sends through the SMTP server set in Admin → Settings → Email (SMTP). */
export async function sendMail(message: MailMessage): Promise<void> {
    const settings = await getStoredSmtpSettings();
    const missing = missingSmtpFields(settings);
    if (missing.length > 0) {
        throw new Error(`SMTP is not configured. Missing: ${missing.join(", ")}.`);
    }

    await createTransport(settings).sendMail({ from: fromAddress(settings), ...message });
}

export type TestEmail = { to: string; subject: string; body: string };

/** Logs in to the SMTP server and, when `testEmail` is given, delivers it as plain text. */
export async function testSmtpSettings(settings: SmtpSettings, testEmail?: TestEmail): Promise<void> {
    const transport = createTransport(settings);
    await transport.verify();

    if (testEmail) {
        await transport.sendMail({
            from: fromAddress(settings),
            to: testEmail.to,
            subject: testEmail.subject,
            text: testEmail.body,
        });
    }
}
