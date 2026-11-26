"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth-guards";
import { CheckoutError, cancelUnpaidBooking, createBooking } from "@/lib/booking";
import { notifyBankDetails } from "@/lib/notify";
import { allow, clientIp } from "@/lib/rate-limit";
import { initializeTransaction } from "@/lib/paystack";

export type CheckoutState = { error: string } | null;

const text = (max: number) => z.string().trim().min(1).max(max);
const methodMap = { card: "CARD", momo: "MOBILE_MONEY", bank: "BANK_TRANSFER" } as const;

const schema = z.object({
  trip: z.string().min(1).max(120),
  travellers: z.coerce.number().int().min(1).max(8),
  plan: z.enum(["deposit", "full"]),
  method: z.enum(["card", "momo", "bank"]),
  firstName: text(60),
  lastName: text(60),
  email: z.email().max(254).transform((e) => e.toLowerCase()),
  whatsapp: z.string().trim().max(30),
  residence: text(80),
  nationality: text(80),
});

// A server action is a public endpoint: everything below treats the form as untrusted input.
export async function startCheckout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Please check your details and try again." };
  const d = parsed.data;

  // Anti seat-hoarding: a booking holds seats for up to 48 h, so cap how fast one person (by IP, and
  // by email) can create them. Normal customers never come near these limits.
  const ip = await clientIp();
  if (!(await allow(`checkout:ip:${ip}`, 8, 600)) || !(await allow(`checkout:email:${d.email}`, 5, 600))) {
    return { error: "Too many booking attempts. Please wait a few minutes and try again." };
  }

  const others: { firstName: string; lastName: string }[] = [];
  for (let n = 2; n <= d.travellers; n++) {
    const first = text(60).safeParse(form.get(`firstName${n}`));
    const last = text(60).safeParse(form.get(`lastName${n}`));
    if (!first.success || !last.success) return { error: `Please enter the name of traveller ${n}.` };
    others.push({ firstName: first.data, lastName: last.data });
  }

  const session = await getSession();
  const method = methodMap[d.method];

  let created;
  try {
    created = await createBooking({
      tripSlug: d.trip,
      plan: d.plan,
      method,
      lead: { firstName: d.firstName, lastName: d.lastName, email: d.email, whatsapp: d.whatsapp, residence: d.residence, nationality: d.nationality },
      others,
      userId: session?.user.id ?? null,
    });
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    console.error("[checkout] createBooking failed", e);
    return { error: "Something went wrong on our side. Please try again." };
  }

  // Bank transfer: no card page. The booking is reserved and staff record the transfer when it arrives.
  if (method === "BANK_TRANSFER") {
    await notifyBankDetails(created.bookingId); // never throws
    redirect(`/confirmation?reference=${created.reference}`);
  }

  const site = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  let url: string;
  try {
    const tx = await initializeTransaction({
      email: d.email,
      amountMinor: created.amountMinor,
      currency: created.currency,
      reference: created.reference,
      callbackUrl: `${site}/confirmation`, // Paystack adds ?reference=... itself
      channels: method === "CARD" ? ["card"] : ["mobile_money"],
      metadata: { bookingId: created.bookingId },
    });
    url = tx.authorization_url;
  } catch (e) {
    console.error("[checkout] Paystack initialize failed", e);
    await cancelUnpaidBooking(created.bookingId); // give the seats back straight away
    return { error: "We could not start the payment. Nothing was charged. Please try again." };
  }

  redirect(url); // outside try/catch: redirect() works by throwing
}
