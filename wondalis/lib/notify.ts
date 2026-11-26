// Booking emails: payment receipt, bank-transfer details, balance reminder.
// Each function loads the booking itself, never throws, and returns whether the email went out.

import { sendEmail, siteUrl } from "@/lib/email";
import { render, type Rows } from "@/lib/email-templates";
import { dateLabel } from "@/lib/db/trips";
import { money } from "@/lib/money";
import { formatRef } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

async function load(bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      departure: { include: { trip: { select: { title: true } } } },
      instalments: { orderBy: { position: "asc" } },
      payments: { where: { status: "PAID" }, select: { amountUsdCents: true } },
    },
  });
  if (!b) return null;
  const paid = b.payments.reduce((s: number, p: { amountUsdCents: number }) => s + p.amountUsdCents, 0);
  const rate = b.fxRateLocked.toNumber();
  const fmt = (cents: number) => money(cents / 100, b.currency, rate);
  const summary: Rows = [
    ["Booking", formatRef(b.refNumber)],
    ["Trip", b.departure.trip.title],
    ["Dates", `${dateLabel(b.departure.startsOn, b.departure.endsOn)}, ${b.departure.startsOn.toISOString().slice(0, 4)}`],
    ["Total", fmt(b.totalUsdCents)],
    ["Paid so far", fmt(paid)],
    ["Balance", fmt(Math.max(0, b.totalUsdCents - paid))],
  ];
  return { b, paid, fmt, summary, first: b.customer.firstName as string, ref: formatRef(b.refNumber) as string };
}

const accountNote = "Sign in with this email address to see your booking: " + siteUrl() + "/account/bookings";

export async function notifyPaymentReceived(bookingId: string, paymentId: string): Promise<boolean> {
  try {
    const d = await load(bookingId);
    const pay = await prisma.payment.findUnique({ where: { id: paymentId }, select: { amountUsdCents: true, status: true } });
    if (!d || !pay || pay.status !== "PAID") return false;
    const settled = d.paid >= d.b.totalUsdCents;
    return await sendEmail(
      render({
        to: d.b.customer.email,
        subject: `Payment received · ${d.ref}`,
        heading: settled ? "You are all paid up" : "Payment received",
        paragraphs: [
          `Hi ${d.first}, we received your payment of ${d.fmt(pay.amountUsdCents)} for ${d.b.departure.trip.title}. Thank you!`,
          settled ? "Your booking is fully paid and confirmed." : "Your seats are secured. The balance is shown below.",
        ],
        rows: d.summary,
        button: { label: "View my booking", href: `${siteUrl()}/account/bookings` },
        footnote: accountNote,
      }),
    );
  } catch (e) {
    console.error("[notify] receipt failed", e);
    return false;
  }
}

export async function notifyBankDetails(bookingId: string): Promise<boolean> {
  try {
    const d = await load(bookingId);
    if (!d) return false;
    const pending = await prisma.payment.findFirst({
      where: { bookingId, status: "PENDING", method: "BANK_TRANSFER" },
      orderBy: { createdAt: "desc" },
      select: { amountUsdCents: true },
    });
    const details = (process.env.BANK_TRANSFER_DETAILS ?? "").replace(/\\n/g, "\n").trim();
    const hours = d.b.holdExpiresAt
      ? Math.max(1, Math.round((d.b.holdExpiresAt.getTime() - Date.now()) / 3_600_000))
      : 48;
    return await sendEmail(
      render({
        to: d.b.customer.email,
        subject: `Your seats are reserved · ${d.ref}`,
        heading: "Your seats are reserved",
        paragraphs: [
          `Hi ${d.first}, we are holding your seats on ${d.b.departure.trip.title} for about ${hours} hours.`,
          pending
            ? `Please transfer ${d.fmt(pending.amountUsdCents)} and use ${d.ref} as the payment reference. We confirm your booking as soon as the money arrives.`
            : `Please transfer the amount due and use ${d.ref} as the payment reference.`,
          details ? "Bank details:" : "Our team will send you the bank details shortly.",
        ],
        note: details || undefined,
        rows: d.summary,
        footnote: `After you transfer, reply to this email or message us on WhatsApp with your proof of payment. ${accountNote}`,
      }),
    );
  } catch (e) {
    console.error("[notify] bank details failed", e);
    return false;
  }
}

export async function notifyBalanceReminder(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const d = await load(bookingId);
    if (!d) return { ok: false, error: "Booking not found." };
    if (d.b.cancelledAt) return { ok: false, error: "This booking is cancelled." };
    const left = d.b.totalUsdCents - d.paid;
    if (left <= 0) return { ok: false, error: "This booking is already fully paid." };
    let covered = d.paid;
    const next = d.b.instalments.find((i: { amountUsdCents: number }) => {
      if (covered >= i.amountUsdCents) {
        covered -= i.amountUsdCents;
        return false;
      }
      return true;
    });
    const due = next?.dueOn ? `${next.dueOn.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}` : null;
    const ok = await sendEmail(
      render({
        to: d.b.customer.email,
        subject: `Balance reminder · ${d.ref}`,
        heading: "A friendly reminder",
        paragraphs: [
          `Hi ${d.first}, you still have ${d.fmt(left)} to pay for ${d.b.departure.trip.title}${due ? `, with the next payment due ${due}` : ""}.`,
          "You can pay online from your account, or reply to this email if you would like to pay by bank transfer.",
        ],
        rows: d.summary,
        button: { label: "Pay my balance", href: `${siteUrl()}/account/bookings` },
        footnote: accountNote,
      }),
    );
    return ok ? { ok: true } : { ok: false, error: "The email could not be sent. Try again shortly." };
  } catch (e) {
    console.error("[notify] reminder failed", e);
    return { ok: false, error: "The email could not be sent." };
  }
}
