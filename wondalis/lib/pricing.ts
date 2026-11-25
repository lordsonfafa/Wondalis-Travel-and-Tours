// Pure money helpers shared by the checkout page (display) and the server (what is actually charged).
// Both sides use the same functions so the amount shown is the amount charged.

import type { Currency } from "@/lib/money";

/** Deposit in USD cents, rounded to a whole dollar. */
export function depositUsdCents(totalUsdCents: number, depositPct: number): number {
  return Math.round((totalUsdCents * depositPct) / 100 / 100) * 100;
}

/**
 * What the customer is charged, in the minor unit of their currency (cents or pesewas).
 * Cedi amounts are rounded to a whole cedi, which is how prices are shown on the site.
 */
export function toMinor(usdCents: number, currency: Currency, rate: number): number {
  return currency === "USD" ? usdCents : Math.round((usdCents / 100) * rate) * 100;
}

/** "WTT-000123": the reference customers see. */
export const formatRef = (refNumber: number) => `WTT-${String(refNumber).padStart(6, "0")}`;
