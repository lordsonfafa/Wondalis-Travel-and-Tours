"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth-guards";
import { CheckoutError } from "@/lib/booking";
import { getQuoteByToken } from "@/lib/db/quotes";
import { notifyBankDetails } from "@/lib/notify";
import { notifyQuoteDeclined } from "@/lib/notify-quotes";
import { initializeTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { allow, clientIp } from "@/lib/rate-limit";
import { cancelUnpaidBooking, createQuoteBooking } from "@/lib/quotes";

export type AcceptState = { error: string } | null;

const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{36}$/),
  plan: z.enum(["deposit", "full"]),
  method: z.enum(["card", "momo", "bank"]),
});
const methodMap = { card: "CARD", momo: "MOBILE_MONEY", bank: "BANK_TRANSFER" } as const;

// The customer accepts the price and pays. The price is never read from the form: it comes from the quote
// the company saved, so nothing the browser sends can change what is charged.
export async function acceptQuote(_prev: AcceptState, form: FormData): Promise<AcceptState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Please choose how you would like to pay." };
  const d = parsed.data;

  const ip = await clientIp();
  if (!(await allow(`quote-pay:ip:${ip}`, 10, 600)) || !(await allow(`quote-pay:token:${d.token}`, 6, 600))) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const session = await getSession();
  const method = methodMap[d.method];

  let created;
  try {
    created = await createQuoteBooking({ token: d.token, plan: d.plan, method, userId: session?.user.id ?? null });
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    console.error("[quote] accept failed", e);
    return { error: "Something went wrong on our side. Please try again." };
  }

  const quote = await getQuoteByToken(d.token);

  if (method === "BANK_TRANSFER") {
    await notifyBankDetails(created.bookingId); // never throws
    redirect(`/confirmation?reference=${created.reference}`);
  }

  const site = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  let url: string;
  try {
    const tx = await initializeTransaction({
      email: quote?.email ?? "",
      amountMinor: created.amountMinor,
      currency: created.currency,
      reference: created.reference,
      callbackUrl: `${site}/confirmation`,
      channels: method === "CARD" ? ["card"] : ["mobile_money"],
      metadata: { bookingId: created.bookingId },
    });
    url = tx.authorization_url;
  } catch (e) {
    console.error("[quote] Paystack initialize failed", e);
    await cancelUnpaidBooking(created.bookingId);
    return { error: "We could not start the payment. Nothing was charged. Please try again." };
  }

  redirect(url); // outside try/catch: redirect() works by throwing
}

export async function declineQuote(token: string): Promise<void> {
  if (!/^[a-f0-9]{36}$/.test(token)) return;
  const ip = await clientIp();
  if (!(await allow(`quote-decline:ip:${ip}`, 10, 600))) return;

  const res = await prisma.quoteRequest.updateMany({
    where: { token, status: { in: ["NEW", "QUOTED"] } },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  if (res.count > 0) {
    const q = await getQuoteByToken(token);
    if (q) await notifyQuoteDeclined(q);
  }
  revalidatePath(`/quote/${token}`);
}
