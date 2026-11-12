import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import { sendMail } from "@/lib/email/mailer";
import { absoluteUrl } from "@/lib/seo";

/**
 * Sent when someone registers with an email that already has an account.
 * The sign-up form shows the same message either way, so it can't be used
 * to find out which emails are registered; the real owner learns here.
 */
export async function sendAccountExistsEmail(to: string, options: { hasPassword: boolean }) {
    const { name: brandName } = await getStoredBrandSettings();
    const signInUrl = absoluteUrl("/signin");
    const resetUrl = absoluteUrl("/forgot-password");

    await sendMail({
        to,
        subject: `You already have a ${brandName} account`,
        html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
        <h2 style="margin:0 0 12px;">You already have an account</h2>
        <p style="margin:0 0 16px;">Someone tried to create a new ${brandName} account with this email address. You already have one, so nothing was changed.</p>
        <p style="margin:0 0 16px;">
          ${
              options.hasPassword
                  ? `<a href="${signInUrl}">Sign in</a>, or <a href="${resetUrl}">reset your password</a> if you've forgotten it.`
                  : `This account uses Google sign-in. <a href="${signInUrl}">Sign in with Google</a>, or <a href="${resetUrl}">set a password</a> to sign in with your email too.`
          }
        </p>
        <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">If this wasn't you, you can ignore this email.</p>
      </div>
    `,
    });
}
