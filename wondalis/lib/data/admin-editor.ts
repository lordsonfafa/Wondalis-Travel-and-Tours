import { getDetail } from "./trip-details";
import { adminTrips } from "./admin";
import { getTrip } from "./trips";

// Placeholder exchange rate. The real rate lives in Admin > Settings (USD to GHS).
import { USD_TO_GHS } from "@/lib/money";
export { USD_TO_GHS };

export type EditorTrip = {
  slug: string;
  title: string;
  type: "ghana" | "abroad";
  destination: string;
  departure: string; // ISO date
  returnDate: string; // ISO date
  seats: string;
  priceUsd: string;
  priceGhs: string;
  depositPct: string;
  overview: string;
  highlights: string[];
  itinerary: { title: string; body: string }[]; // days, in order
  included: string[];
  gallery: string[];
  published: boolean;
  seoTitle: string;
};

export const emptyTrip: EditorTrip = {
  slug: "",
  title: "",
  type: "ghana",
  destination: "",
  departure: "",
  returnDate: "",
  seats: "12",
  priceUsd: "",
  priceGhs: "",
  depositPct: "30",
  overview: "",
  highlights: [],
  itinerary: [],
  included: [],
  gallery: [],
  published: false,
  seoTitle: "",
};

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase());

/** Dummy: builds the editor form from the existing dummy trips. The backend will load a real record. */
export function getEditorTrip(slug: string): EditorTrip | null {
  const row = adminTrips.find((t) => t.slug === slug);
  const trip = getTrip(slug);
  if (!row || !trip) return null;

  const end = new Date(`${trip.startsOn}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + trip.nights);

  return {
    slug,
    title: row.title,
    type: row.type,
    destination: titleCase(trip.location),
    departure: trip.startsOn,
    returnDate: end.toISOString().slice(0, 10),
    seats: String(row.seatsTotal),
    priceUsd: String(row.priceUsd),
    priceGhs: String(row.priceUsd * USD_TO_GHS),
    depositPct: "30",
    overview: getDetail(trip).overview,
    highlights: [...getDetail(trip).highlights],
    itinerary: getDetail(trip).itinerary.map((d) => ({ title: d.title, body: d.body })),
    included: [...getDetail(trip).included],
    gallery: [...getDetail(trip).gallery],
    published: row.status === "Published",
    seoTitle: row.title,
  };
}