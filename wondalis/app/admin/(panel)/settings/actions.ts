"use server";

import { updateTag } from "next/cache";
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
