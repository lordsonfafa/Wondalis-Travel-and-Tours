// Sends email through Resend's HTTP API (no extra package). Never throws: a failed email must not
// break a payment or a booking. With no RESEND_API_KEY (local development) the email is printed to
// the terminal instead, so every flow can be tested without a mail account.

import { after } from "next/server";

const FROM = process.env.EMAIL_FROM ?? "Wondalis Travel and Tour <onboarding@resend.dev>";
export const siteUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export type Email = { to: string; subject: string; html: string; text: string };

export async function sendEmail(mail: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email:dev] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
    return true;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) {
      console.error(`[email] Resend refused (${res.status}):`, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}

/** Sends after the response is on its way (so a slow mail server never slows a page, and response
 *  timing does not reveal whether an account exists). Falls back to fire-and-forget. */
export function sendInBackground(mail: Email) {
  const job = sendEmail(mail);
  try {
    after(job);
  } catch {
    void job;
  }
}
