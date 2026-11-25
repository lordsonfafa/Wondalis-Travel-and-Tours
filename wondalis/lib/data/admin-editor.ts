// The shape of the trip form in the admin editor. Real trips load through lib/db/admin-trips.ts.

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
