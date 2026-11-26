// A small shared rate limiter for our own server actions. It reuses the RateLimit table that Better
// Auth already created (keys are prefixed "app:" so they never collide), so counters are shared by
// every server instance and need no migration.

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/** The caller's IP as reported by the hosting platform ("unknown" when absent). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** Counts one attempt for `key`. Returns false when more than `max` attempts happened in `windowSec`. */
export async function allow(key: string, max: number, windowSec: number): Promise<boolean> {
  const id = `app:${key}`;
  const now = Date.now();
  try {
    const row = await prisma.rateLimit.findUnique({ where: { key: id } });
    if (!row || now - Number(row.lastRequest) > windowSec * 1000) {
      await prisma.rateLimit.upsert({
        where: { key: id },
        create: { id, key: id, count: 1, lastRequest: BigInt(now) },
        update: { count: 1, lastRequest: BigInt(now) },
      });
      return true;
    }
    if (row.count >= max) return false;
    await prisma.rateLimit.update({ where: { key: id }, data: { count: { increment: 1 } } });
    return true;
  } catch (e) {
    console.error("[rate-limit] check failed; allowing the request", e);
    return true; // a broken limiter must not take checkout down
  }
}
