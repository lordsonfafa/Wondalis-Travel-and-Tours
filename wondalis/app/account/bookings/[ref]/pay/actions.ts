"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCustomer } from "@/lib/auth-guards";
import { holdsSeats } from "@/lib/booking";
import { initializeTransaction } from "@/lib/paystack";
import { toMinor } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export type PayState = { error: string } | null;

const schema = z.object({ ref: z.string().regex(/^WTT-\d{1,9}$/), method: z.enum(["card", "momo", "bank"]) });
const methodMap = { card: "CARD", momo: "MOBILE_MONEY", bank: "BANK_TRANSFER" } as const;

// Pays everything still owed on one of the signed-in customer's bookings.
// The amount is worked out here from the database; the browser only says which booking and which method.
export async function payBalance(_prev: PayState, form: FormData): Promise<PayState> {
  const user = await requireCustomer();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Please choose a payment method." };
  const { ref, method: m } = parsed.data;
  const method = methodMap[m];

  const booking = await prisma.booking.findFirst({
    where: { refNumber: Number(ref.slice(4)), customer: { userId: user.id }, ...holdsSeats(new Date()) },
    include: {
      customer: { select: { email: true } },
      payments: { where: { status: "PAID" }, select: { amountUsdCents: true } },
      instalments: { orderBy: { position: "asc" }, select: { id: true, amountUsdCents: true } },
    },
  });
  if (!booking) return { error: "We could not find that booking." };

  const paidCents = booking.payments.reduce((sum, p) => sum + p.amountUsdCents, 0);
  const balanceCents = booking.totalUsdCents - paidCents;
  if (balanceCents <= 0) redirect(`/account/bookings/${ref}`);

  if (method === "MOBILE_MONEY" && booking.currency !== "GHS") {
    return { error: "Mobile money is only available for bookings in cedis." };
  }

  const rate = booking.fxRateLocked.toNumber(); // this booking's own locked rate, not today's
  const amountMinor = toMinor(balanceCents, booking.currency, rate);
  const reference = randomBytes(18).toString("hex");

  // Attach the payment to the first instalment that is not covered yet.
  let covered = paidCents;
  let targetId: string | undefined;
  for (const inst of booking.instalments) {
    if (covered >= inst.amountUsdCents) covered -= inst.amountUsdCents;
    else {
      targetId = inst.id;
      break;
    }
  }

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      instalmentId: targetId ?? booking.instalments.at(-1)?.id,
      amountUsdCents: balanceCents,
      currency: booking.currency,
      amountMinor,
      fxRate: rate,
      method,
      status: "PENDING",
      providerRef: reference,
    },
  });

  // Bank transfer: staff record it when it arrives (admin step).
  if (method === "BANK_TRANSFER") redirect(`/account/bookings/${ref}?bank=1`);

  const site = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  let url: string;
  try {
    const tx = await initializeTransaction({
      email: booking.customer.email,
      amountMinor,
      currency: booking.currency,
      reference,
      callbackUrl: `${site}/account/bookings/${ref}`, // Paystack adds ?reference=...
      channels: method === "CARD" ? ["card"] : ["mobile_money"],
      metadata: { bookingId: booking.id },
    });
    url = tx.authorization_url;
  } catch (e) {
    console.error("[pay-balance] Paystack initialize failed", e);
    await prisma.payment.updateMany({ where: { providerRef: reference, status: "PENDING" }, data: { status: "FAILED" } });
    return { error: "We could not start the payment. Nothing was charged. Please try again." };
  }
  redirect(url);
}
