// The shape of a booking as the account pages show it. Real bookings come from lib/db/account.ts.
export type Booking = {
  ref: string; // "WTT-000123"
  slug?: string; // link back to the trip, if it still exists
  title: string;
  dates: string;
  startsOn: string; // ISO date, for the calendar file
  nights: number;
  place: string; // "Ghana", "Zanzibar"…
  travellers: number;
  totalUsd: number;
  paidUsd: number;
  /** Trips in Ghana are priced in cedis, trips abroad in dollars. Amounts stay in USD. */
  currency: "USD" | "GHS";
  /** The USD→GHS rate locked when this booking was made. Cedi amounts always use it. */
  rate: number;
  image: string;
  when: "upcoming" | "past";
  /** Date the remaining balance is due (display label). Only set while a balance is owed. */
  balanceDue?: string;
  /** Payments already made, newest first. Amounts in USD, like the totals. */
  history: { date: string; amountUsd: number; method: "Card" | "Mobile money" | "Bank transfer" }[];
};
