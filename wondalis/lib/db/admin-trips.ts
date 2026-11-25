// Admin-side trip reads. Unlike lib/db/trips.ts these include drafts, so they are NOT cached
// and callers must call requireStaff() first.

import { prisma } from "@/lib/prisma";
import { holdsSeats } from "@/lib/booking";
import { dateLabel } from "@/lib/db/trips";
import type { AdminTrip } from "@/lib/data/admin";
import type { EditorTrip } from "@/lib/data/admin-editor";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function listAdminTrips(): Promise<AdminTrip[]> {
  const rows = await prisma.trip.findMany({
    include: { departures: { orderBy: { startsOn: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  return Promise.all(
    rows.map(async (t) => {
      const dep = t.departures[0];
      const booked = dep
        ? await prisma.traveller.count({ where: { booking: { departureId: dep.id, ...holdsSeats(now) } } })
        : 0;
      return {
        slug: t.slug,
        title: t.title,
        type: t.type === "GHANA" ? "ghana" : "abroad",
        dates: dep ? dateLabel(dep.startsOn, dep.endsOn) : "No departure",
        priceUsd: t.priceUsdCents / 100,
        seatsBooked: booked,
        seatsTotal: dep?.seatsTotal ?? 0,
        status: t.status === "PUBLISHED" ? "Published" : "Draft",
        image: t.coverImage || "/icons/star-nav.svg",
      } satisfies AdminTrip;
    }),
  );
}

export async function getEditorTrip(slug: string): Promise<EditorTrip | null> {
  const t = await prisma.trip.findUnique({
    where: { slug },
    include: {
      itinerary: { orderBy: { position: "asc" } },
      departures: { orderBy: { startsOn: "asc" }, take: 1 },
    },
  });
  if (!t) return null;
  const dep = t.departures[0];
  return {
    slug: t.slug,
    title: t.title,
    type: t.type === "GHANA" ? "ghana" : "abroad",
    destination: t.destination,
    departure: dep ? iso(dep.startsOn) : "",
    returnDate: dep ? iso(dep.endsOn) : "",
    seats: String(dep?.seatsTotal ?? 12),
    priceUsd: String(t.priceUsdCents / 100),
    priceGhs: String(t.priceGhsPesewas / 100),
    depositPct: String(t.depositPct),
    overview: t.overview,
    highlights: t.highlights,
    itinerary: t.itinerary.map((d) => ({ title: d.title, body: d.body })),
    included: t.included,
    gallery: t.gallery,
    published: t.status === "PUBLISHED",
    seoTitle: t.seoTitle ?? t.title,
  };
}
