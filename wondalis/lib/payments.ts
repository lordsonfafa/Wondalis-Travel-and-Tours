import { prisma } from "@/lib/prisma";
import { holdsSeats, cancelUnpaidBooking } from "@/lib/booking";
import type { PaystackTransaction } from "@/lib/paystack";

export type Settled = "paid" | "failed" | "pending" | "unknown";

/**
 * Applies what Paystack says about a payment to our ledger. Called from BOTH the webhook and the
 * confirmation page, and safe to call any number of times for the same payment (idempotent):
 * the PENDING → PAID update only succeeds once, so a payment can never be counted twice.
 *
 * `tx` must come from Paystack itself (a verified webhook body, or the verify API),
 * never from the browser.
 */
export async function applyTransaction(tx: PaystackTransaction): Promise<Settled> {
  const payment = await prisma.payment.findUnique({
    where: { providerRef: tx.reference },
    include: { booking: { include: { departure: true, travellers: { select: { id: true } } } } },
  });
  if (!payment) return "unknown";
  if (payment.status === "PAID") return "paid";

  if (tx.status === "failed") {
    await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
    await cancelUnpaidBooking(payment.bookingId);
    return "failed";
  }
  if (tx.status !== "success") return "pending"; // abandoned / still in progress: leave it alone

  // Never mark paid unless Paystack confirms the exact amount and currency we asked for.
  if (tx.amount !== payment.amountMinor || tx.currency !== payment.currency) {
    console.error(`[payments] MISMATCH ${tx.reference}: got ${tx.amount} ${tx.currency}, expected ${payment.amountMinor} ${payment.currency}`);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { note: `Amount mismatch: Paystack reported ${tx.amount} ${tx.currency}. Needs manual review.` },
    });
    return "pending";
  }

  await prisma.$transaction(async (db) => {
    const updated = await db.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (updated.count === 0) return; // another request already recorded it

    // The money is real, but the seats may have been released while the customer was paying
    // (hold expired). Re-check under the same row lock used for booking.
    const { booking } = payment;
    const now = new Date();
    const wasHeld = booking.cancelledAt === null && booking.holdExpiresAt !== null && booking.holdExpiresAt > now;
    if (wasHeld) return;

    await db.$queryRaw`SELECT id FROM "Departure" WHERE id = ${booking.departureId} FOR UPDATE`;
    const taken = await db.traveller.count({
      where: { booking: { departureId: booking.departureId, id: { not: booking.id }, ...holdsSeats(now) } },
    });
    if (taken + booking.travellers.length <= booking.departure.seatsTotal) {
      await db.booking.update({ where: { id: booking.id }, data: { cancelledAt: null } });
    } else {
      await db.payment.update({
        where: { id: payment.id },
        data: { note: "PAID AFTER SEATS WERE RELEASED and the departure is now full. Refund or re-seat this customer." },
      });
      console.error(`[payments] oversold departure ${booking.departureId}: booking ${booking.id} needs staff attention`);
    }
  });
  return "paid";
}
