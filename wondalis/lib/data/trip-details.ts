import { trips, type Trip } from "./trips";

export type TripDetail = {
  overview: string;
  highlights: string[];
  itinerary: { title: string; body: string }[];
  included: string[];
  gallery: [string, string, string]; // main image + two side images
};

// Full content for the trip designed in Figma. Itinerary text for days 2 to 4 is placeholder.
const accra: TripDetail = {
  overview:
    "Nine days of beaches, food and nightlife in Accra, with a local host and private airport pickup.",
  highlights: [
    "Beach day at Labadi",
    "Curated nightlife in Osu",
    "Street-food tasting tour",
    "Free day to see family",
  ],
  itinerary: [
    {
      title: "Arrival in Accra",
      body: "Private airport pickup, hotel check-in and a welcome dinner with your host and group.",
    },
    {
      title: "Labadi Beach day",
      body: "A relaxed day on the sand with music, local snacks and time in the water.",
    },
    {
      title: "Accra city & culture",
      body: "Markets, art and landmarks around the city with your host.",
    },
    {
      title: "Free day with family",
      body: "Time to yourself. Your host can arrange transport on request.",
    },
  ],
  included: [
    "Airport pickup and drop-off",
    "Accommodation and breakfast",
    "Hosted activities listed",
    "Local transport",
  ],
  gallery: ["/images/hero.png", "/images/trip-accra.png", "/images/trip-kakum-volta.png"],
};

const detailsBySlug: Record<string, TripDetail> = {
  "accra-beach-nightlife-week": accra,
};

const imagePool = [
  "/images/hero.png",
  "/images/trip-accra.png",
  "/images/trip-cape-coast.png",
  "/images/trip-kakum-volta.png",
  "/images/trip-zanzibar.png",
  "/images/trip-dubai.png",
];

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** Placeholder content built from the trip's own fields, until the backend supplies real itineraries. */
function generic(trip: Trip): TripDetail {
  const place = titleCase(trip.location.split("·")[0].trim());
  const i = trips.findIndex((t) => t.slug === trip.slug);
  const others = imagePool.filter((p) => p !== trip.image);
  return {
    overview: `${trip.nights} nights in ${place}, with a local host and private airport pickup.`,
    highlights: [
      "Local host and guide",
      "Hand-picked stays",
      "Group dinners",
      "Free time to explore",
    ],
    itinerary: [
      {
        title: `Arrival in ${place}`,
        body: "Private airport pickup, check-in and a welcome dinner with your host and group.",
      },
      {
        title: `Explore ${place}`,
        body: "A guided day at the best-known spots, with time to wander on your own.",
      },
      {
        title: "Local culture and food",
        body: "Meet local makers, taste regional dishes and see the area through your host's eyes.",
      },
      {
        title: "Free day",
        body: "Time to yourself. Your host can arrange transport or activities on request.",
      },
    ],
    included: [
      "Airport pickup and drop-off",
      "Accommodation and breakfast",
      "Hosted activities listed",
      "Local transport",
    ],
    gallery: [trip.image, others[i % others.length], others[(i + 1) % others.length]],
  };
}

export function getDetail(trip: Trip): TripDetail {
  return detailsBySlug[trip.slug] ?? generic(trip);
}
