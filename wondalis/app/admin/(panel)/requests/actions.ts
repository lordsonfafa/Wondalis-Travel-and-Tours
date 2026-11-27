"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth-guards";
import { getRequestById } from "@/lib/db/quotes";
import { getFxRate } from "@/lib/fx";
import { notifyQuoteSent } from "@/lib/notify-quotes";
import { prisma } from "@/lib/prisma";

export type QuoteResult = { ok: true; emailed: boolean } | { ok: false; error: string };

const schema = z.object({
  id: z.string().min(1).max(40),
  amount: z.coerce.number().positive("Enter the total price.").max(100_000_000),
  depositPct: z.coerce.number().int().min(1, "Deposit must be 1 to 100 percent.").max(100, "Deposit must be 1 to 100 percent."),
  validDays: z.coerce.number().int().min(1, "Choose how many days the price is valid.").max(60),
  message: z.string().trim().max(1500),
});

// Staff only. The amount is typed in the currency the customer will pay (cedis for Ghana-only plans,
// dollars otherwise) and stored in USD like every other price on the site.
export async function sendQuote(input: unknown): Promise<QuoteResult> {
  const user = await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;

  const current = await getRequestById(d.id);
  if (!current) return { ok: false, error: "This request no longer exists." };

  const usdCents = current.currency === "GHS" ? Math.round((d.amount / (await getFxRate())) * 100) : Math.round(d.amount * 100);
  const validUntil = new Date(Date.now() + d.validDays * 24 * 60 * 60 * 1000);

  // Only a request that is still open can be (re)priced: an accepted or cancelled one is left alone.
  const res = await prisma.quoteRequest.updateMany({
    where: { id: d.id, status: { in: ["NEW", "QUOTED", "DECLINED"] } },
    data: {
      status: "QUOTED",
      quotedUsdCents: usdCents,
      depositPct: d.depositPct,
      quoteMessage: d.message,
      quotedAt: new Date(),
      validUntil,
      quotedById: user.id,
      respondedAt: null,
    },
  });
  if (res.count === 0) return { ok: false, error: "This request has already been accepted or closed, so it cannot be repriced." };

  const fresh = await getRequestById(d.id);
  const emailed = fresh ? await notifyQuoteSent(fresh) : false;
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${d.id}`);
  return { ok: true, emailed };
}

export async function cancelRequest(id: string): Promise<QuoteResult> {
  await requireStaff();
  const current = await getRequestById(id);
  if (!current) return { ok: false, error: "This request no longer exists." };
  if (current.view === "paid" || current.view === "paying") return { ok: false, error: "This request has a payment, so it cannot be cancelled here." };
  const res = await prisma.quoteRequest.updateMany({ where: { id, status: { in: ["NEW", "QUOTED", "DECLINED"] } }, data: { status: "CANCELLED", respondedAt: new Date() } });
  if (res.count === 0) return { ok: false, error: "This request can no longer be cancelled." };
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  return { ok: true, emailed: false };
}
