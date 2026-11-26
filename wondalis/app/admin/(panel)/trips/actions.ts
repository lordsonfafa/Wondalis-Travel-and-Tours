"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth-guards";
import { holdsSeats } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export type SaveTripResult = { ok: true; slug: string } | { ok: false; error: string };

const line = (max: number) => z.string().trim().min(1).max(max);
// Photos are paths on this site ("/images/…") or files uploaded to OUR Cloudinary account. Anything else
// (another site, blob:, javascript:) is refused: an unknown image host would break the public trip page.
const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const photo = z
  .string()
  .max(500)
  .refine((s) => /^\/(?!\/)/.test(s) || (cloud !== "" && s.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`)), "Invalid photo address");

const schema = z.object({
  originalSlug: z.string().max(100).optional(), // set when editing an existing trip
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes in the URL slug").max(100),
  title: line(120),
  type: z.enum(["ghana", "abroad"]),
  destination: line(100),
  departure: z.iso.date(),
  returnDate: z.iso.date(),
  seats: z.coerce.number().int().min(1).max(500),
  priceUsd: z.coerce.number().min(0).max(1_000_000),
  priceGhs: z.coerce.number().min(0).max(100_000_000),
  depositPct: z.coerce.number().int().min(1).max(100),
  overview: z.string().trim().max(2000),
  highlights: z.array(line(200)).max(20),
  itinerary: z.array(z.object({ title: line(120), body: z.string().trim().max(2000) })).max(60),
  included: z.array(line(200)).max(30),
  gallery: z.array(photo).max(30),
  videoUrls: z.array(z.string().trim().max(300).refine((s) => /^https:\/\//.test(s) && URL.canParse(s), "Video links must start with https://")).max(6),
  recapNote: z.string().trim().max(400),
  published: z.boolean(),
  seoTitle: z.string().trim().max(120),
});

class SaveError extends Error {}

// A server action is a public endpoint, so it checks the role itself and validates everything.
export async function saveTrip(input: unknown): Promise<SaveTripResult> {
  await requireStaff();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message && first.message !== "Invalid input" ? first.message : `Please check the “${String(first?.path[0] ?? "form")}” field.` };
  }
  const d = parsed.data;

  if (d.returnDate < d.departure) return { ok: false, error: "The return date cannot be before the departure date." };
  // A trip whose return date has passed is a past trip: it is shown on Experiences, not for booking,
  // so it needs no price.
  const isPast = d.returnDate < new Date().toISOString().slice(0, 10);
  if (d.published) {
    if (d.gallery.length === 0) return { ok: false, error: "Add at least one photo before publishing." };
    if (!isPast && d.priceUsd <= 0) return { ok: false, error: "Set a price before publishing." };
  }

  try {
    const slug = await prisma.$transaction(async (tx) => {
      const existing = d.originalSlug ? await tx.trip.findUnique({ where: { slug: d.originalSlug } }) : null;
      if (d.originalSlug && !existing) throw new SaveError("This trip no longer exists.");
      const clash = await tx.trip.findUnique({ where: { slug: d.slug } });
      if (clash && clash.id !== existing?.id) throw new SaveError("Another trip already uses that URL slug.");

      const data = {
        slug: d.slug,
        title: d.title,
        type: d.type === "ghana" ? ("GHANA" as const) : ("ABROAD" as const),
        destination: d.destination,
        overview: d.overview,
        highlights: d.highlights,
        included: d.included,
        gallery: d.gallery,
        videoUrls: d.videoUrls.filter(Boolean),
        recapNote: d.recapNote || null,
        coverImage: d.gallery[0] ?? "",
        priceUsdCents: Math.round(d.priceUsd * 100),
        priceGhsPesewas: Math.round(d.priceGhs * 100),
        depositPct: d.depositPct,
        status: d.published ? ("PUBLISHED" as const) : ("DRAFT" as const),
        seoTitle: d.seoTitle || null,
      };
      const trip = existing
        ? await tx.trip.update({ where: { id: existing.id }, data })
        : await tx.trip.create({ data });

      await tx.itineraryDay.deleteMany({ where: { tripId: trip.id } });
      if (d.itinerary.length) {
        await tx.itineraryDay.createMany({
          data: d.itinerary.map((day, i) => ({ tripId: trip.id, position: i + 1, title: day.title, body: day.body })),
        });
      }

      // The editor manages one departure per trip: the earliest one.
      const dep = await tx.departure.findFirst({ where: { tripId: trip.id }, orderBy: { startsOn: "asc" } });
      const dates = { startsOn: new Date(`${d.departure}T00:00:00Z`), endsOn: new Date(`${d.returnDate}T00:00:00Z`), seatsTotal: d.seats };
      if (dep) {
        await tx.$queryRaw`SELECT id FROM "Departure" WHERE id = ${dep.id} FOR UPDATE`; // do not race a booking
        const taken = await tx.traveller.count({ where: { booking: { departureId: dep.id, ...holdsSeats(new Date()) } } });
        if (d.seats < taken) throw new SaveError(`${taken} seats are already booked, so the total cannot be below ${taken}.`);
        await tx.departure.update({ where: { id: dep.id }, data: dates });
      } else {
        await tx.departure.create({ data: { tripId: trip.id, ...dates } });
      }
      return trip.slug;
    });

    // Visitors see the change on their next request instead of waiting for the cache to expire.
    updateTag("trips");
    updateTag(`trip:${d.slug}`);
    if (d.originalSlug && d.originalSlug !== d.slug) updateTag(`trip:${d.originalSlug}`);
    return { ok: true, slug };
  } catch (e) {
    if (e instanceof SaveError) return { ok: false, error: e.message };
    console.error("[admin] saveTrip failed", e);
    return { ok: false, error: "Could not save the trip. Please try again." };
  }
}
