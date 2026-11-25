import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

// The Setting table has exactly one row (id = 1). Creates it with the schema defaults if it is
// missing (a fresh production database has no seed).
export async function getSettings() {
  return prisma.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

type RateSettings = { fxMode: "LIVE" | "FIXED"; fixedRate: { toNumber(): number }; liveRate: { toNumber(): number } | null };

/** FIXED always uses the owner's pinned rate. LIVE uses the daily rate, or the fixed rate until the first fetch succeeds. */
export function effectiveRate(s: RateSettings): number {
  if (s.fxMode === "FIXED" || s.liveRate === null) return s.fixedRate.toNumber();
  return s.liveRate.toNumber();
}

/**
 * The rate the whole site uses to show prices (cedis per dollar). Cached and tagged "fx": pages never
 * wait on the exchange-rate API or the database for it, and the daily job or an Admin > Settings
 * change refreshes it by expiring the tag.
 */
export async function getFxRate(): Promise<number> {
  "use cache";
  cacheLife("hours");
  cacheTag("fx");
  return effectiveRate(await getSettings());
}

const SANITY_MIN = 1; // cedis per dollar; outside this range the API response is treated as bad data
const SANITY_MAX = 100;
const MAX_JUMP = 0.25; // a >25% move in one day is rejected until the owner confirms it by hand

export type RefreshResult =
  | { ok: true; rate: number; updatedAt: Date }
  | { ok: false; error: string };

/**
 * Fetches today's USD→GHS rate and stores it in Settings. Called by the daily cron job and by the
 * "Refresh now" button. It does NOT expire the cache: callers do that (revalidateTag in the route,
 * updateTag in a server action).
 * Uses a keyed ExchangeRate-API plan when EXCHANGE_RATE_API_KEY is set (no attribution needed);
 * otherwise the open endpoint, which requires crediting exchangerate-api.com on the site.
 */
export async function fetchAndStoreLiveRate(): Promise<RefreshResult> {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  const url = key
    ? `https://v6.exchangerate-api.com/v6/${key}/latest/USD`
    : "https://open.er-api.com/v6/latest/USD";

  let rate: number;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, error: `Rate provider answered ${res.status}` };
    const data = (await res.json()) as { result?: string; rates?: Record<string, unknown> };
    const value = data.rates?.GHS;
    if (data.result !== "success" || typeof value !== "number") {
      return { ok: false, error: "Rate provider returned an unexpected response" };
    }
    rate = value;
  } catch {
    return { ok: false, error: "Could not reach the rate provider" };
  }

  if (!Number.isFinite(rate) || rate < SANITY_MIN || rate > SANITY_MAX) {
    return { ok: false, error: `Rejected rate ${rate}: outside the expected range` };
  }

  const current = await getSettings();
  if (current.liveRate) {
    const before = current.liveRate.toNumber();
    if (Math.abs(rate - before) / before > MAX_JUMP) {
      return { ok: false, error: `Rejected rate ${rate}: moved more than 25% from ${before}` };
    }
  }

  const rounded = Math.round(rate * 1_000_000) / 1_000_000;
  const updated = await prisma.setting.update({
    where: { id: 1 },
    data: { liveRate: rounded, liveRateUpdatedAt: new Date() },
  });
  return { ok: true, rate: rounded, updatedAt: updated.liveRateUpdatedAt! };
}
