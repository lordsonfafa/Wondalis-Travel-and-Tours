// Data access for trips. Pages call these functions and never touch Prisma directly.
//
// Why this layer exists:
// - One place knows how the database is shaped. If a column changes, we fix it here.
// - Pages keep receiving the same `Trip` / `TripDetail` shapes they already used with the
//   dummy data, so the UI did not have to change.
// - Each function is cached (`use cache`), so visitors are served from the cache and the
//   database is queried at most once per cache lifetime, not once per page view.
// - Each cache entry carries a tag. When an admin edits a trip, we call
//   revalidateTag("trips") and the next visitor gets fresh data (see the admin step).

import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TripDetail } from "@/lib/data/trip-details";
import type { Trip, TripTag } from "@/lib/data/trips";

// Only the soonest departure is needed to show a trip on a card.
const tripInclude = {
  departures: { orderBy: { startsOn: "asc" }, take: 1 },
} satisfies Prisma.TripInclude;

const detailInclude = {
  ...tripInclude,
  itinerary: { orderBy: { position: "asc" } },
} satisfies Prisma.TripInclude;

type TripRow = Prisma.TripGetPayload<{ include: typeof tripInclude }>;
type TripDetailRow = Prisma.TripGetPayload<{ include: typeof detailInclude }>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** "Dec 18 – 27" when both dates share a month, otherwise "Dec 27 – Jan 2". */
export function dateLabel(start: Date, end: Date) {
  const m1 = MONTHS[start.getUTCMonth()];
  const m2 = MONTHS[end.getUTCMonth()];
  const d1 = start.getUTCDate();
  const d2 = end.getUTCDate();
  return m1 === m2 ? `${m1} ${d1} – ${d2}` : `${m1} ${d1} – ${m2} ${d2}`;
}

/** Turns a database row into the `Trip` shape the pages already use. */
function toTrip(row: TripRow): Trip | null {
  const departure = row.departures[0];
  if (!departure) return null; // a trip with no departure cannot be shown or booked

  return {
    slug: row.slug,
    title: row.title,
    location: row.destination.toUpperCase(),
    type: row.type === "GHANA" ? "ghana" : "abroad",
    tags: row.tags.map((t) => t.toLowerCase() as TripTag),
    nights: Math.round((departure.endsOn.getTime() - departure.startsOn.getTime()) / DAY_MS),
    dates: dateLabel(departure.startsOn, departure.endsOn),
    startsOn: departure.startsOn.toISOString().slice(0, 10),
    priceUsd: row.priceUsdCents / 100, // cents → dollars, only at the edge, for display
    image: row.coverImage,
  };
}

function toDetail(row: TripDetailRow): TripDetail {
  const g = row.gallery.length > 0 ? row.gallery : [row.coverImage];
  return {
    overview: row.overview,
    highlights: row.highlights,
    itinerary: row.itinerary.map((d) => ({ title: d.title, body: d.body })),
    included: row.included,
    gallery: [g[0], g[1] ?? g[0], g[2] ?? g[0]], // the page expects a main image plus two side images
  };
}

/** All published trips, soonest departure first. */
export async function getTrips(): Promise<Trip[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("trips");

  const rows = await prisma.trip.findMany({
    where: { status: "PUBLISHED" }, // drafts never reach the public site
    include: tripInclude,
  });

  return rows
    .map(toTrip)
    .filter((t): t is Trip => t !== null)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn));
}

/** One published trip with its full content, or null if the slug does not exist or is a draft. */
export async function getTripBySlug(slug: string): Promise<{ trip: Trip; detail: TripDetail } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("trips", `trip:${slug}`); // the slug is part of the cache key automatically

  const row = await prisma.trip.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: detailInclude,
  });
  if (!row) return null;

  const trip = toTrip(row);
  return trip ? { trip, detail: toDetail(row) } : null;
}
