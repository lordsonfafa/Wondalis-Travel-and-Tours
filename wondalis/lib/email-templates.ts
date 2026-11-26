// Every email is built from one small structure, rendered as both HTML and plain text.

import { siteUrl, type Email } from "@/lib/email";

export type Rows = [label: string, value: string][];
type Content = {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  rows?: Rows;
  note?: string; // pre-formatted block (e.g. bank details)
  button?: { label: string; href: string };
  footnote?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function render(c: Content): Email {
  const rows = c.rows?.length
    ? `<table style="width:100%;border-collapse:collapse;margin:20px 0">${c.rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;color:#6b7266;font-size:14px">${esc(k)}</td><td style="padding:8px 0;text-align:right;color:#1d3a2a;font-weight:600;font-size:15px">${esc(v)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const note = c.note
    ? `<pre style="white-space:pre-wrap;background:#f6f1e6;border-radius:12px;padding:16px;font:14px/1.6 inherit;color:#1d3a2a;margin:20px 0">${esc(c.note)}</pre>`
    : "";
  const button = c.button
    ? `<p style="margin:28px 0"><a href="${esc(c.button.href)}" style="background:#1d3a2a;color:#fbf8f1;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:600;font-size:15px;display:inline-block">${esc(c.button.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f6f1e6;padding:24px 12px;font-family:Georgia,'Times New Roman',serif">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:36px 32px;border:1px solid #e8e1d0">
<p style="margin:0 0 20px;font:700 12px/16px Arial,sans-serif;letter-spacing:2px;color:#4a7a5a">WONDALIS TRAVEL AND TOUR</p>
<h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#1d3a2a">${esc(c.heading)}</h1>
<div style="font:16px/1.6 Arial,sans-serif;color:#2b2f2a">
${c.paragraphs.map((p) => `<p style="margin:0 0 14px">${esc(p)}</p>`).join("")}
${rows}${note}${button}
${c.footnote ? `<p style="margin:20px 0 0;font-size:13px;color:#6b7266">${esc(c.footnote)}</p>` : ""}
</div></div>
<p style="max-width:560px;margin:14px auto 0;text-align:center;font:12px Arial,sans-serif;color:#8a8f84">Wondalis Travel and Tour · <a href="${esc(siteUrl())}" style="color:#8a8f84">${esc(siteUrl().replace(/^https?:\/\//, ""))}</a></p>
</body></html>`;
  const text = [
    c.heading,
    "",
    ...c.paragraphs,
    ...(c.rows?.length ? ["", ...c.rows.map(([k, v]) => `${k}: ${v}`)] : []),
    ...(c.note ? ["", c.note] : []),
    ...(c.button ? ["", `${c.button.label}: ${c.button.href}`] : []),
    ...(c.footnote ? ["", c.footnote] : []),
  ].join("\n");
  return { to: c.to, subject: c.subject, html, text };
}

export const verifyEmail = (to: string, name: string, url: string) =>
  render({
    to,
    subject: "Confirm your email · Wondalis Travel and Tour",
    heading: "Confirm your email",
    paragraphs: [
      `Hi ${name.split(" ")[0] || "there"}, thanks for creating an account. Please confirm this is your email address.`,
      "Once confirmed, any bookings you made with this email appear in your account.",
    ],
    button: { label: "Confirm my email", href: url },
    footnote: "If you did not create an account, you can ignore this email.",
  });

export const resetPasswordEmail = (to: string, name: string, url: string) =>
  render({
    to,
    subject: "Reset your password · Wondalis Travel and Tour",
    heading: "Reset your password",
    paragraphs: [
      `Hi ${name.split(" ")[0] || "there"}, we received a request to reset your password. The link works for one hour.`,
    ],
    button: { label: "Choose a new password", href: url },
    footnote: "If you did not ask for this, ignore this email: your password stays the same.",
  });
