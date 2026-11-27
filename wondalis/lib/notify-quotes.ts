// Emails for custom-trip requests. Each function never throws.

import { sendEmail, sendInBackground, siteUrl } from "@/lib/email";
import { quoteReadyEmail, requestReceivedEmail, staffAlertEmail } from "@/lib/email-templates";
import { money } from "@/lib/money";
import { getFxRate } from "@/lib/fx";
import { prisma } from "@/lib/prisma";
import type { QuoteDetail } from "@/lib/db/quotes";

const quoteUrl = (q: QuoteDetail) => `${siteUrl()}/quote/${q.token}`;
const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

async function staffEmails(): Promise<string[]> {
  const rows = await prisma.user.findMany({ where: { role: { in: ["owner", "staff"] } }, select: { email: true }, take: 20 });
  return rows.map((r: { email: string }) => r.email);
}

/** Customer gets a receipt for the request; the team gets an alert. */
export async function notifyRequestSubmitted(q: QuoteDetail) {
  try {
    sendInBackground(requestReceivedEmail(q.email, q.firstName, q.ref, q.places.map((p) => p.name), quoteUrl(q)));
    const team = await staffEmails();
    for (const to of team) {
      sendInBackground(
        staffAlertEmail(
          to,
          `New trip request · ${q.ref}`,
          "New custom trip request",
          [`${q.firstName} ${q.lastName} chose ${q.places.length} place${q.places.length === 1 ? "" : "s"} and is waiting for a price.`],
          [
            ["Request", q.ref],
            ["Travellers", String(q.travellers)],
            ["Places", q.places.map((p) => p.name).join(", ")],
          ],
          `${siteUrl()}/admin/requests/${q.id}`,
        ),
      );
    }
  } catch (e) {
    console.error("[notify] request submitted failed", e);
  }
}

export async function notifyQuoteSent(q: QuoteDetail): Promise<boolean> {
  try {
    if (q.quotedUsd === null || !q.validUntil) return false;
    const rate = await getFxRate();
    const total = money(q.quotedUsd, q.currency, rate);
    const deposit = q.depositPct && q.depositPct < 100 ? money((q.quotedUsd * q.depositPct) / 100, q.currency, rate) : null;
    return await sendEmail(
      quoteReadyEmail(
        q.email,
        q.firstName,
        q.ref,
        [
          ["Request", q.ref],
          ["Places", q.places.map((p) => p.name).join(", ")],
          ["Travellers", String(q.travellers)],
          ["Total price", total],
          ...(deposit ? ([["Deposit to confirm", deposit]] as [string, string][]) : []),
        ],
        q.message,
        when(q.validUntil),
        quoteUrl(q),
      ),
    );
  } catch (e) {
    console.error("[notify] quote sent failed", e);
    return false;
  }
}

export async function notifyQuoteDeclined(q: QuoteDetail) {
  try {
    for (const to of await staffEmails()) {
      sendInBackground(
        staffAlertEmail(to, `Quote declined · ${q.ref}`, "A quote was declined", [`${q.firstName} ${q.lastName} declined the price for ${q.ref}.`], [["Request", q.ref]], `${siteUrl()}/admin/requests/${q.id}`),
      );
    }
  } catch (e) {
    console.error("[notify] declined failed", e);
  }
}
