export type TripType = "ghana" | "abroad";
export type TripTag = "beach" | "heritage" | "family";

export type Trip = {
  slug: string;
  title: string;
  location: string;
  type: TripType;
  tags: TripTag[];
  nights: number;
  dates: string; // display label, as on the cards
  startsOn: string; // ISO date, used for the date filter
  priceUsd: number;
  image: string;
};

// Dummy data from the Figma Home and Trips screens, plus a few trips outside
// December so the site reads as year-round. Replace with backend later.
// `tags` and the non-December trips are placeholder assumptions.
export const trips: Trip[] = [
  {
    slug: "accra-beach-nightlife-week",
    title: "Accra Beach & Nightlife Week",
    location: "ACCRA · LABADI",
    type: "ghana",
    tags: ["beach"],
    nights: 9,
    dates: "Dec 18 – 27",
    startsOn: "2026-12-18",
    priceUsd: 1450,
    image: "/images/trip-accra.png",
  },
  {
    slug: "heritage-roots-cape-coast",
    title: "Heritage & Roots: Cape Coast",
    location: "CAPE COAST · KUMASI",
    type: "ghana",
    tags: ["heritage"],
    nights: 8,
    dates: "Dec 20 – 28",
    startsOn: "2026-12-20",
    priceUsd: 1890,
    image: "/images/trip-cape-coast.png",
  },
  {
    slug: "kakum-volta-adventure",
    title: "Kakum & Volta Adventure",
    location: "KAKUM · VOLTA REGION",
    type: "ghana",
    tags: ["family"],
    nights: 7,
    dates: "Dec 21 – 28",
    startsOn: "2026-12-21",
    priceUsd: 1290,
    image: "/images/trip-kakum-volta.png",
  },
  {
    slug: "festival-weekender",
    title: "Festival Weekender",
    location: "ACCRA",
    type: "ghana",
    tags: ["beach"],
    nights: 4,
    dates: "Dec 26 – 30",
    startsOn: "2026-12-26",
    priceUsd: 980,
    image: "/images/trip-accra.png",
  },
  {
    slug: "zanzibar-island-escape",
    title: "Zanzibar Island Escape",
    location: "ZANZIBAR · TANZANIA",
    type: "abroad",
    tags: ["beach", "family"],
    nights: 7,
    dates: "Dec 22 – 29",
    startsOn: "2026-12-22",
    priceUsd: 1650,
    image: "/images/trip-zanzibar.png",
  },
  {
    slug: "dubai-city-break",
    title: "Dubai City Break",
    location: "DUBAI · UAE",
    type: "abroad",
    tags: ["family"],
    nights: 6,
    dates: "Dec 27 – Jan 2",
    startsOn: "2026-12-27",
    priceUsd: 1980,
    image: "/images/trip-dubai.png",
  },
  // Placeholder trips outside December (photos reused until real ones exist)
  {
    slug: "ada-foah-river-retreat",
    title: "Ada Foah River Retreat",
    location: "ADA FOAH · GREATER ACCRA",
    type: "ghana",
    tags: ["beach", "family"],
    nights: 3,
    dates: "Feb 12 – 15",
    startsOn: "2027-02-12",
    priceUsd: 540,
    image: "/images/trip-kakum-volta.png",
  },
  {
    slug: "easter-at-busua-beach",
    title: "Easter at Busua Beach",
    location: "BUSUA · WESTERN REGION",
    type: "ghana",
    tags: ["beach", "family"],
    nights: 4,
    dates: "Mar 25 – 29",
    startsOn: "2027-03-25",
    priceUsd: 760,
    image: "/images/trip-zanzibar.png",
  },
  {
    slug: "emancipation-day-homecoming",
    title: "Emancipation Day Homecoming",
    location: "CAPE COAST · ACCRA",
    type: "ghana",
    tags: ["heritage"],
    nights: 6,
    dates: "Jul 28 – Aug 3",
    startsOn: "2027-07-28",
    priceUsd: 1320,
    image: "/images/trip-cape-coast.png",
  },
];

export const featuredTrips = trips.slice(0, 3);

/* ---------- Date helpers ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12" for a trip that starts in December 2026 */
export const monthKey = (t: Trip) => t.startsOn.slice(0, 7);

/** "2026-12" -> "Dec 2026" */
export function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** Months that have at least one trip, in order */
export const departureMonths = Array.from(new Set(trips.map(monthKey))).sort();

/** Months that have at least one trip in the given list, in order. */
export const monthsOf = (list: Trip[]) => Array.from(new Set(list.map(monthKey))).sort();

export const getTrip = (slug: string) => trips.find((t) => t.slug === slug);

/** "Dec 18 – 27, 2026". Trips that cross into a new year are left without a year. */
export function departureLabel(t: Trip) {
  const crossesYear = t.dates.includes("Dec") && t.dates.includes("Jan");
  return crossesYear ? t.dates : `${t.dates}, ${t.startsOn.slice(0, 4)}`;
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** Where the trip goes: "Ghana" for trips in Ghana, otherwise the first place name ("Zanzibar", "Dubai"). */
export const placeName = (t: Trip) =>
  t.type === "ghana" ? "Ghana" : titleCase(t.location.split("·")[0].trim());
