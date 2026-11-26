"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth-guards";
import { holdsSeats } from "@/lib/booking";
import { notifyBalanceReminder, notifyPaymentReceived } from "@/lib/notify";
import { toMinor } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export type RecordResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  bookingId: z.string().min(1).max(40),
  amount: z.coerce.number().positive().max(1_000_000), // USD, as entered in the dialog
  method: z.enum(["Bank transfer", "Mobile money", "Cash", "Card"]),
});
const methodMap = { "Bank transfer": "BANK_TRANSFER", "Mobile money": "MOBILE_MONEY", Cash: "BANK_TRANSFER", Card: "CARD" } as const;

class RecordError extends Error {}

// Staff or Owner: records money received outside Paystack (bank transfer, cash…).
// The amount is added to the append-only ledger; it never edits an old payment.
export async function recordPayment(input: unknown): Promise<RecordResult> {
  const staff = await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter an amount above zero." };
  const { bookingId, amount, method } = parsed.data;
  const cents = Math.round(amount * 100);

  let paymentId = "";
  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          departure: true,
          travellers: { select: { id: true } },
          instalments: { orderBy: { position: "asc" } },
          payments: { where: { status: "PAID" }, select: { amountUsdCents: true } },
        },
      });
      if (!booking) throw new RecordError("Booking not found.");
      if (booking.cancelledAt) throw new RecordError("This booking is cancelled.");

      const paid = booking.payments.reduce((s, p) => s + p.amountUsdCents, 0);
      if (cents > booking.totalUsdCents - paid) {
        throw new RecordError("That is more than the balance still owed on this booking.");
      }

      // If the hold had already expired, the seats may have been released: check before confirming.
      const now = new Date();
      if (paid === 0 && !(booking.holdExpiresAt && booking.holdExpiresAt > now)) {
        await tx.$queryRaw`SELECT id FROM "Departure" WHERE id = ${booking.departureId} FOR UPDATE`;
        const taken = await tx.traveller.count({
          where: { booking: { departureId: booking.departureId, id: { not: booking.id }, ...holdsSeats(now) } },
        });
        if (taken + booking.travellers.length > booking.departure.seatsTotal) {
          throw new RecordError("This departure has since filled up, so the booking cannot be confirmed. Contact the customer.");
        }
      }

      let covered = paid;
      const target = booking.instalments.find((i) => {
        if (covered >= i.amountUsdCents) {
          covered -= i.amountUsdCents;
          return false;
        }
        return true;
      });

      const rate = booking.fxRateLocked.toNumber(); // the booking's own locked rate
      const data = {
        amountUsdCents: cents,
        currency: booking.currency,
        amountMinor: toMinor(cents, booking.currency, rate),
        fxRate: rate,
        method: methodMap[method],
        status: "PAID" as const,
        paidAt: now,
        recordedById: staff.id,
        note: method === "Cash" ? "Received in cash" : null,
      };

      // The customer may already have asked to pay by bank transfer: settle that pending row
      // instead of creating a second one for the same money.
      const pending = await tx.payment.findFirst({
        where: { bookingId, status: "PENDING", method: "BANK_TRANSFER", amountUsdCents: cents },
      });
      const saved = pending
        ? await tx.payment.update({ where: { id: pending.id }, data })
        : await tx.payment.create({ data: { ...data, bookingId, instalmentId: target?.id ?? booking.instalments.at(-1)?.id } });
      paymentId = saved.id;

      // A confirmed booking keeps its seats for good (it now has a PAID payment).
      await tx.booking.update({ where: { id: bookingId }, data: { holdExpiresAt: null } });
    });
    await notifyPaymentReceived(bookingId, paymentId); // never throws; prints to the terminal without a Resend key
    // Re-render every admin page that shows this money, in the same round trip as the action.
    for (const path of ["/admin", "/admin/bookings", "/admin/customers", "/admin/payments"]) revalidatePath(path);
    return { ok: true };
  } catch (e) {
    if (e instanceof RecordError) return { ok: false, error: e.message };
    console.error("[admin] recordPayment failed", e);
    return { ok: false, error: "Could not record the payment. Please try again." };
  }
}

// Staff or Owner: emails the customer a balance reminder (what is left and the next due date).
export async function sendReminder(bookingId: unknown): Promise<RecordResult> {
  await requireStaff();
  const id = z.string().min(1).max(40).safeParse(bookingId);
  if (!id.success) return { ok: false, error: "Booking not found." };
  const res = await notifyBalanceReminder(id.data);
  return res.ok ? { ok: true } : { ok: false, error: res.error ?? "Could not send the reminder." };
}
