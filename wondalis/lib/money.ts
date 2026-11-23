/** Placeholder exchange rate. The backend will supply a real one. */
export const USD_TO_GHS = 15;

export type Currency = "USD" | "GHS";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const ghs = (n: number) => `GH₵${Math.round(n).toLocaleString("en-US")}`;

/** Amounts are stored in USD. Shows the paid currency first and the other as a smaller line. */
export function formatMoney(amountUsd: number, currency: Currency) {
  return currency === "GHS"
    ? { primary: ghs(amountUsd * USD_TO_GHS), secondary: usd(amountUsd) }
    : { primary: usd(amountUsd), secondary: `≈ ${ghs(amountUsd * USD_TO_GHS)}` };
}

const fmt = (amountUsd: number, currency: Currency) =>
  currency === "GHS" ? ghs(amountUsd * USD_TO_GHS) : usd(amountUsd);

/** Customer-facing price: trips in Ghana are priced in cedis, trips abroad in dollars. */
export const tripCurrency = (type: "ghana" | "abroad"): Currency =>
  type === "ghana" ? "GHS" : "USD";

/** Single formatted amount (amount stored in USD) in the given currency. */
export const money = fmt;

/** Short form for tight spaces: 10,000 → 10k, 321,750 → 321.8k, 1,200,000 → 1.2M. */
export function moneyCompact(amountUsd: number, currency: Currency) {
  const value = currency === "GHS" ? amountUsd * USD_TO_GHS : amountUsd;
  const symbol = currency === "GHS" ? "₵ " : "$ ";
  const trim = (n: number) => String(Math.round(n * 10) / 10);
  if (value >= 1_000_000) return `${symbol}${trim(value / 1_000_000)}M`;
  if (value >= 1_000) return `${symbol}${trim(value / 1_000)}k`;
  return `${symbol}${Math.round(value)}`;
}