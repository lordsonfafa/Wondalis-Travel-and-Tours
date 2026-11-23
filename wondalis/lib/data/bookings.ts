export type Booking = {
  ref: string;
  slug?: string; // link back to the trip, if it still exists
  title: string;
  dates: string;
  travellers: number;
  totalUsd: number;
  paidUsd: number;
  /** Trips in Ghana are priced in cedis, trips abroad in dollars. Amounts stay in USD. */
  currency: "USD" | "GHS";
  image: string;
  when: "upcoming" | "past";
  /** Date the remaining balance is due (display label). Only set while a balance is owed. */
  balanceDue?: string;
  /** Payments already made, newest first. Amounts in USD, like the totals. */
  history: { date: string; amountUsd: number; method: "Card" | "Mobile money" | "Bank transfer" }[];
};

// Dummy bookings for the signed-in customer. The first two match the Figma design.
// The backend will return these from the customer's account instead.
export const bookings: Booking[] = [
  {
    ref: "WTT-100001",
    slug: "accra-beach-nightlife-week",
    title: "Accra Beach & Nightlife Week",
    dates: "Dec 18 – 27",
    travellers: 2,
    totalUsd: 2900,
    paidUsd: 870,
    currency: "GHS",
    image: "/images/trip-accra.png",
    when: "upcoming",
    balanceDue: "Nov 18",
    history: [{ date: "Oct 12", amountUsd: 870, method: "Card" }],
  },
  {
    ref: "WTT-100002",
    slug: "kakum-volta-adventure",
    title: "Kakum & Volta Adventure",
    dates: "Dec 21 – 28",
    travellers: 1,
    totalUsd: 1290,
    paidUsd: 1290,
    currency: "GHS",
    image: "/images/trip-kakum-volta.png",
    when: "upcoming",
    history: [{ date: "Oct 3", amountUsd: 1290, method: "Mobile money" }],
  },
  {
    ref: "WTT-100003",
    title: "Volta Weekend Getaway",
    dates: "Aug 7 – 10",
    travellers: 2,
    totalUsd: 1040,
    paidUsd: 1040,
    currency: "GHS",
    image: "/images/trip-kakum-volta.png",
    when: "past",
    history: [{ date: "Jun 20", amountUsd: 1040, method: "Card" }],
  },
];

export const getBooking = (ref: string) => bookings.find((b) => b.ref === ref);