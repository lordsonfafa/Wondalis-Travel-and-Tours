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
import { parseVideo, type Video } from "@/lib/video";

// All departures (a trip has few). Which one counts, and whether the trip is upcoming or past,
// is decided in toTrip / toPast below.
const tripInclude = {
  departures: { orderBy: { startsOn: "asc" } },
} satisfies Prisma.TripInclude;

const startOfToday = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};

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
  // The soonest departure that has not started. Trips with none are either finished (they move to
  // Experiences, see getPastTrips) or running right now: neither is bookable, so neither is listed.
  const today = startOfToday();
  const departure = row.departures.find((d: { startsOn: Date }) => d.startsOn >= today);
  if (!departure) return null;

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

// ───────────── Past trips (the Experiences page) ─────────────

export type PastTrip = {
  slug: string;
  title: string;
  destination: string;
  type: "ghana" | "abroad";
  dates: string; // "Dec 18 – 27, 2025"
  endedOn: string; // ISO date
  overview: string;
  note: string;
  cover: string;
  gallery: string[];
  videos: Video[];
};

// A trip is "past" when none of its departures is still ahead and the latest one has finished.
function toPast(row: TripRow & { videoUrls: string[]; recapNote: string | null; gallery: string[]; overview: string }): PastTrip | null {
  const today = startOfToday();
  if (row.departures.length === 0) return null;
  if (row.departures.some((d: { startsOn: Date }) => d.startsOn >= today)) return null; // still bookable
  const last = row.departures[row.departures.length - 1] as { startsOn: Date; endsOn: Date };
  if (last.endsOn >= today) return null; // running right now
  const gallery = row.gallery.length > 0 ? row.gallery : [row.coverImage];
  return {
    slug: row.slug,
    title: row.title,
    destination: row.destination,
    type: row.type === "GHANA" ? "ghana" : "abroad",
    dates: `${dateLabel(last.startsOn, last.endsOn)}, ${last.endsOn.getUTCFullYear()}`,
    endedOn: last.endsOn.toISOString().slice(0, 10),
    overview: row.overview,
    note: row.recapNote ?? "",
    cover: row.coverImage || gallery[0],
    gallery,
    videos: row.videoUrls.map(parseVideo).filter((v: Video | null): v is Video => v !== null),
  };
}

/** Published trips that have already happened, most recent first. They appear on Experiences by themselves. */
export async function getPastTrips(): Promise<PastTrip[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("trips");

  const rows = await prisma.trip.findMany({ where: { status: "PUBLISHED" }, include: tripInclude });
  return rows
    .map(toPast)
    .filter((t: PastTrip | null): t is PastTrip => t !== null)
    .sort((a: PastTrip, b: PastTrip) => b.endedOn.localeCompare(a.endedOn));
}

export async function getPastTripBySlug(slug: string): Promise<PastTrip | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("trips", `trip:${slug}`);

  const row = await prisma.trip.findFirst({ where: { slug, status: "PUBLISHED" }, include: tripInclude });
  return row ? toPast(row) : null;
}
