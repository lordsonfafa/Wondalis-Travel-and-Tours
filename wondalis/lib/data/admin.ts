// Dummy admin data from the Figma Dashboard. The backend will compute all of this.

export type PaymentStatus = "Paid" | "Partial" | "Due" | "Cancelled";

// `usd` amounts are shown in cedis on the dashboard; `value` is a plain count.
export const kpis: { label: string; usd?: number; value?: string }[] = [
  { label: "Revenue collected", usd: 48200 },
  { label: "Bookings", value: "64" },
  { label: "Outstanding balances", usd: 21450 },
  { label: "Seats left", value: "112" },
];

export const recentBookings: {
  ref: string;
  customer: string;
  trip: string;
  paidUsd: number;
  status: PaymentStatus;
}[] = [
  { ref: "WTT-0142", customer: "Ama Mensah", trip: "Accra Beach & Nightlife", paidUsd: 870, status: "Partial" },
  { ref: "WTT-0141", customer: "Kofi Boateng", trip: "Kakum & Volta", paidUsd: 1290, status: "Paid" },
  { ref: "WTT-0140", customer: "Esi Owusu", trip: "Dubai City Break", paidUsd: 594, status: "Partial" },
  { ref: "WTT-0139", customer: "Yaw Adjei", trip: "Heritage & Roots", paidUsd: 0, status: "Due" },
  { ref: "WTT-0138", customer: "Abena Asare", trip: "Zanzibar Escape", paidUsd: 1650, status: "Paid" },
];

export const departures = [
  { trip: "Accra Beach & Nightlife", date: "Dec 18", bookedPct: 75 },
  { trip: "Heritage & Roots", date: "Dec 20", bookedPct: 50 },
  { trip: "Kakum & Volta", date: "Dec 21", bookedPct: 90 },
];

export type TripStatus = "Published" | "Draft";

export type AdminTrip = {
  slug: string;
  title: string;
  type: "ghana" | "abroad";
  dates: string;
  priceUsd: number;
  seatsBooked: number;
  seatsTotal: number;
  status: TripStatus;
  image: string;
};

// Dummy trips from the Figma Admin / Trips screen.
export const adminTrips: AdminTrip[] = [
  { slug: "accra-beach-nightlife-week", title: "Accra Beach & Nightlife Week", type: "ghana", dates: "Dec 18 – 27", priceUsd: 1450, seatsBooked: 12, seatsTotal: 16, status: "Published", image: "/images/trip-accra.png" },
  { slug: "heritage-roots-cape-coast", title: "Heritage & Roots: Cape Coast", type: "ghana", dates: "Dec 20 – 28", priceUsd: 1890, seatsBooked: 8, seatsTotal: 14, status: "Published", image: "/images/trip-cape-coast.png" },
  { slug: "kakum-volta-adventure", title: "Kakum & Volta Adventure", type: "ghana", dates: "Dec 21 – 28", priceUsd: 1290, seatsBooked: 14, seatsTotal: 16, status: "Published", image: "/images/trip-kakum-volta.png" },
  { slug: "festival-weekender", title: "Festival Weekender", type: "ghana", dates: "Dec 26 – 30", priceUsd: 980, seatsBooked: 5, seatsTotal: 20, status: "Draft", image: "/images/trip-accra.png" },
  { slug: "zanzibar-island-escape", title: "Zanzibar Island Escape", type: "abroad", dates: "Dec 22 – 29", priceUsd: 1650, seatsBooked: 9, seatsTotal: 12, status: "Published", image: "/images/trip-zanzibar.png" },
  { slug: "dubai-city-break", title: "Dubai City Break", type: "abroad", dates: "Dec 27 – Jan 2", priceUsd: 1980, seatsBooked: 3, seatsTotal: 12, status: "Published", image: "/images/trip-dubai.png" },
];

// ---- Bookings (Figma Admin / Bookings) ----

export type ScheduleItem = {
  label: string;
  amountUsd: number;
  paid: boolean;
  /** Part-payment already received towards this line (USD), when it is not fully paid yet. */
  receivedUsd?: number;
  due?: string; // display label, e.g. "Nov 30"
  overdue?: boolean;
};

export type AdminBooking = {
  id?: string; // database id (absent in the dummy seed data)
  ref: string;
  customer: string;
  trip: string;
  travellers: number;
  totalUsd: number;
  paidUsd: number;
  cancelled?: boolean;
  schedule: ScheduleItem[];
};

export function bookingStatus(b: AdminBooking): PaymentStatus {
  if (b.cancelled) return "Cancelled";
  if (b.paidUsd >= b.totalUsd) return "Paid";
  if (b.paidUsd > 0) return "Partial";
  return "Due";
}

// Dummy bookings. The first six match the Figma screen; WTT-0136 is added so the
// Cancelled filter has something in it. The backend will return the real list.
export const adminBookings: AdminBooking[] = [
  {
    ref: "WTT-0142", customer: "Ama Mensah", trip: "Accra Beach & Nightlife", travellers: 2, totalUsd: 2900, paidUsd: 870,
    schedule: [
      { label: "Deposit", amountUsd: 870, paid: true },
      { label: "Instalment 1", amountUsd: 1015, paid: false, due: "Nov 30" },
      { label: "Instalment 2", amountUsd: 1015, paid: false, due: "Dec 10" },
    ],
  },
  {
    ref: "WTT-0141", customer: "Kofi Boateng", trip: "Kakum & Volta", travellers: 1, totalUsd: 1290, paidUsd: 1290,
    schedule: [{ label: "Full payment", amountUsd: 1290, paid: true }],
  },
  {
    ref: "WTT-0140", customer: "Esi Owusu", trip: "Dubai City Break", travellers: 1, totalUsd: 1980, paidUsd: 594,
    schedule: [
      { label: "Deposit", amountUsd: 594, paid: true },
      { label: "Balance", amountUsd: 1386, paid: false, due: "Dec 5" },
    ],
  },
  {
    ref: "WTT-0139", customer: "Yaw Adjei", trip: "Heritage & Roots", travellers: 1, totalUsd: 1890, paidUsd: 0,
    schedule: [
      { label: "Deposit", amountUsd: 567, paid: false, due: "Nov 20", overdue: true },
      { label: "Balance", amountUsd: 1323, paid: false, due: "Dec 5" },
    ],
  },
  {
    ref: "WTT-0138", customer: "Abena Asare", trip: "Zanzibar Escape", travellers: 1, totalUsd: 1650, paidUsd: 1650,
    schedule: [{ label: "Full payment", amountUsd: 1650, paid: true }],
  },
  {
    ref: "WTT-0137", customer: "Nana Agyei", trip: "Festival Weekender", travellers: 1, totalUsd: 980, paidUsd: 294,
    schedule: [
      { label: "Deposit", amountUsd: 294, paid: true },
      { label: "Balance", amountUsd: 686, paid: false, due: "Dec 12" },
    ],
  },
  {
    ref: "WTT-0136", customer: "Kwesi Appiah", trip: "Dubai City Break", travellers: 1, totalUsd: 1980, paidUsd: 0, cancelled: true,
    schedule: [],
  },
];

export type AdminCustomer = {
  id?: string;
  name: string;
  country: string;
  bookings: number;
  paid: number;
  balance: number;
  latestTrip: string;
};

export const adminCustomers: AdminCustomer[] = [
  { name: "Ama Mensah", country: "United Kingdom", bookings: 2, paid: 870, balance: 2030, latestTrip: "Accra Beach & Nightlife" },
  { name: "Kofi Boateng", country: "United States", bookings: 1, paid: 1290, balance: 0, latestTrip: "Kakum & Volta" },
  { name: "Esi Owusu", country: "Ghana", bookings: 1, paid: 594, balance: 1386, latestTrip: "Dubai City Break" },
  { name: "Yaw Adjei", country: "Canada", bookings: 1, paid: 0, balance: 1890, latestTrip: "Heritage & Roots" },
  { name: "Abena Asare", country: "Ghana", bookings: 1, paid: 1650, balance: 0, latestTrip: "Zanzibar Escape" },
  { name: "Nana Agyei", country: "Germany", bookings: 1, paid: 294, balance: 686, latestTrip: "Festival Weekender" },
];

export type PaymentRecordStatus = "Paid" | "Pending" | "Failed";

export type AdminPayment = {
  id: string;
  date: string;
  ref: string;
  customer: string;
  method: "Card" | "Mobile money" | "Bank transfer";
  /** Amount in USD; `currency` is what the customer actually paid in. */
  amount: number;
  currency: "USD" | "GHS";
  /** USD→GHS rate this payment was made at (absent in the dummy data: the live rate is used). */
  rate?: number;
  status: PaymentRecordStatus;
};

// Dummy summary figures from the design; with a backend these are computed from real payments.
export const paymentKpis: { label: string; usd?: number; value?: string }[] = [
  { label: "Collected this month", usd: 48200 },
  { label: "Pending", usd: 21450 },
  { label: "Failed", value: "3" },
];

export const adminPayments: AdminPayment[] = [
  { id: "p1", date: "Nov 21", ref: "WTT-0142", customer: "Ama Mensah", method: "Card", amount: 870, currency: "USD", status: "Paid" },
  { id: "p2", date: "Nov 21", ref: "WTT-0141", customer: "Kofi Boateng", method: "Card", amount: 1290, currency: "USD", status: "Paid" },
  { id: "p3", date: "Nov 20", ref: "WTT-0140", customer: "Esi Owusu", method: "Mobile money", amount: 594, currency: "GHS", status: "Paid" },
  { id: "p4", date: "Nov 20", ref: "WTT-0139", customer: "Yaw Adjei", method: "Card", amount: 945, currency: "USD", status: "Failed" },
  { id: "p5", date: "Nov 19", ref: "WTT-0138", customer: "Abena Asare", method: "Bank transfer", amount: 1650, currency: "GHS", status: "Paid" },
  { id: "p6", date: "Nov 19", ref: "WTT-0137", customer: "Nana Agyei", method: "Mobile money", amount: 294, currency: "USD", status: "Pending" },
];