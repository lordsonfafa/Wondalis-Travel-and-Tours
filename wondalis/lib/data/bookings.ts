export type Booking = {
  ref: string;
  slug?: string; // link back to the trip, if it still exists
  title: string;
  dates: string;
  travellers: number;
  totalUsd: number;
  paidUsd: number;
  image: string;
  when: "upcoming" | "past";
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
    image: "/images/trip-accra.png",
    when: "upcoming",
  },
  {
    ref: "WTT-100002",
    slug: "kakum-volta-adventure",
    title: "Kakum & Volta Adventure",
    dates: "Dec 21 – 28",
    travellers: 1,
    totalUsd: 1290,
    paidUsd: 1290,
    image: "/images/trip-kakum-volta.png",
    when: "upcoming",
  },
  {
    ref: "WTT-100003",
    title: "Volta Weekend Getaway",
    dates: "Aug 7 – 10",
    travellers: 2,
    totalUsd: 1040,
    paidUsd: 1040,
    image: "/images/trip-kakum-volta.png",
    when: "past",
  },
];
