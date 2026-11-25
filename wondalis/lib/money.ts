/**
 * Dummy-data rate. Only the seed script and the dummy admin data still use it; every real price on
 * the site uses the rate from `getFxRate()` (server) or `useFxRate()` (client), see lib/fx.ts.
 */
export const DUMMY_USD_TO_GHS = 15;

export type Currency = "USD" | "GHS";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const ghs = (n: number) => `GH₵${Math.round(n).toLocaleString("en-US")}`;

/**
 * Amounts are stored in USD. `rate` is how many cedis one dollar buys: the current site rate for
 * browsing, or a booking's locked rate once a booking exists.
 * Shows the paid currency first and the other as a smaller line.
 */
export function formatMoney(amountUsd: number, currency: Currency, rate: number) {
  return currency === "GHS"
    ? { primary: ghs(amountUsd * rate), secondary: usd(amountUsd) }
    : { primary: usd(amountUsd), secondary: `≈ ${ghs(amountUsd * rate)}` };
}

/** Customer-facing price: trips in Ghana are priced in cedis, trips abroad in dollars. */
export const tripCurrency = (type: "ghana" | "abroad"): Currency =>
  type === "ghana" ? "GHS" : "USD";

/** Single formatted amount (amount stored in USD) in the given currency. */
export const money = (amountUsd: number, currency: Currency, rate: number) =>
  currency === "GHS" ? ghs(amountUsd * rate) : usd(amountUsd);

/** Short form for tight spaces: 10,000 → 10k, 321,750 → 321.8k, 1,200,000 → 1.2M. */
export function moneyCompact(amountUsd: number, currency: Currency, rate: number) {
  const value = currency === "GHS" ? amountUsd * rate : amountUsd;
  const symbol = currency === "GHS" ? "₵ " : "$ ";
  const trim = (n: number) => String(Math.round(n * 10) / 10);
  if (value >= 1_000_000) return `${symbol}${trim(value / 1_000_000)}M`;
  if (value >= 1_000) return `${symbol}${trim(value / 1_000)}k`;
  return `${symbol}${Math.round(value)}`;
}
