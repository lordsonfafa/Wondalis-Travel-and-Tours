"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireOwner } from "@/lib/auth-guards";
import { fetchAndStoreLiveRate, getSettings } from "@/lib/fx";
import { prisma } from "@/lib/prisma";

// Every server action is a public endpoint: anyone can POST to it. So each one checks the role itself.

export type FxActionResult =
  | { ok: true; liveRate: number | null; liveRateUpdatedAt: string | null }
  | { ok: false; error: string };

export async function saveFxSettings(input: { mode: "LIVE" | "FIXED"; fixedRate: number }): Promise<FxActionResult> {
  await requireOwner();

  if (input.mode !== "LIVE" && input.mode !== "FIXED") return { ok: false, error: "Invalid rate source" };
  const fixed = Number(input.fixedRate);
  if (!Number.isFinite(fixed) || fixed < 1 || fixed > 100) {
    return { ok: false, error: "Enter a fixed rate between 1 and 100" };
  }

  await getSettings(); // makes sure the row exists
  const s = await prisma.setting.update({
    where: { id: 1 },
    data: { fxMode: input.mode, fixedRate: Math.round(fixed * 1_000_000) / 1_000_000 },
  });
  updateTag("fx"); // the next page view shows the new rate straight away
  return { ok: true, liveRate: s.liveRate?.toNumber() ?? null, liveRateUpdatedAt: s.liveRateUpdatedAt?.toISOString() ?? null };
}

export async function refreshLiveRateNow(): Promise<FxActionResult> {
  await requireOwner();
  const result = await fetchAndStoreLiveRate();
  if (!result.ok) return result;
  updateTag("fx");
  return { ok: true, liveRate: result.rate, liveRateUpdatedAt: result.updatedAt.toISOString() };
}

// ───────────── Team (Owner only). In the UI the database role "owner" is called "Admin". ─────────────

export type TeamActionResult = { ok: true } | { ok: false; error: string };

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(254).transform((e) => e.toLowerCase()),
  role: z.enum(["Admin", "Staff"]),
});

// The new person gets an email with a link to choose their own password: nobody types or sees one.
async function sendInvite(email: string) {
  await auth.api.requestPasswordReset({ body: { email, redirectTo: "/admin/reset-password" } });
}

export async function inviteMember(input: unknown): Promise<TeamActionResult> {
  await requireOwner();
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a name and a valid email." };
  const { name, email, role } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, error: "That email already has an account." };
  }
  await prisma.user.create({
    data: { id: randomUUID().replace(/-/g, ""), name, email, role: role === "Admin" ? "owner" : "staff", emailVerified: false },
  });
  await sendInvite(email);
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function resendInvite(userId: unknown): Promise<TeamActionResult> {
  await requireOwner();
  const id = z.string().min(1).max(60).safeParse(userId);
  if (!id.success) return { ok: false, error: "Person not found." };
  const user = await prisma.user.findUnique({ where: { id: id.data } });
  if (!user || (user.role !== "staff" && user.role !== "owner")) return { ok: false, error: "Person not found." };
  if (user.emailVerified) return { ok: false, error: "They have already set up their account." };
  await sendInvite(user.email);
  return { ok: true };
}

export async function removeMember(userId: unknown): Promise<TeamActionResult> {
  const me = await requireOwner();
  const id = z.string().min(1).max(60).safeParse(userId);
  if (!id.success) return { ok: false, error: "Person not found." };
  if (id.data === me.id) return { ok: false, error: "You cannot remove your own access." };

  const user = await prisma.user.findUnique({ where: { id: id.data } });
  if (!user || (user.role !== "staff" && user.role !== "owner")) return { ok: false, error: "Person not found." };
  if (user.role === "owner" && (await prisma.user.count({ where: { role: "owner" } })) <= 1) {
    return { ok: false, error: "There must always be at least one Admin." };
  }

  // Sign them out everywhere first, so access ends immediately.
  await prisma.session.deleteMany({ where: { userId: user.id } });
  try {
    if (!user.emailVerified) {
      await prisma.user.delete({ where: { id: user.id } }); // invite never accepted: nothing to keep
    } else {
      // They may have recorded payments (the ledger points at them), so keep the row and just
      // take the admin role away. They become an ordinary customer account.
      await prisma.user.update({ where: { id: user.id }, data: { role: "customer" } });
    }
  } catch {
    await prisma.user.update({ where: { id: user.id }, data: { role: "customer" } });
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}
