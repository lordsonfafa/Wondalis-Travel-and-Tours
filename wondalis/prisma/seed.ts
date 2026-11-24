// Development seed: loads the frontend's dummy data into the database.
//
// Run with:  npx prisma db seed
// Safe to run repeatedly: it wipes the business tables first. It refuses to run in production.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { trips } from "../lib/data/trips";
import { getDetail } from "../lib/data/trip-details";
import { adminTrips, adminBookings, adminCustomers, adminPayments } from "../lib/data/admin";
import { USD_TO_GHS } from "../lib/money";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed a production database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ---- small helpers -------------------------------------------------------

const cents = (usd: number) => Math.round(usd * 100);
const pesewas = (usd: number) => Math.round(usd * USD_TO_GHS * 100);

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase());

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** "Nov 30" → a Date in 2026. The dummy data only has display labels. */
function labelToDate(label?: string): Date | null {
  if (!label) return null;
  const [m, d] = label.split(" ");
  return new Date(Date.UTC(2026, MONTHS[m], Number(d)));
}

function addDays(iso: string, days: number): Date {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Admin screens use short trip names; map the ones that don't match by prefix.
const tripAlias: Record<string, string> = { "Zanzibar Escape": "zanzibar-island-escape" };

function findTrip(shortName: string) {
  const alias = tripAlias[shortName];
  return trips.find((t) => (alias ? t.slug === alias : t.title.startsWith(shortName)));
}

const METHOD = {
  Card: "CARD",
  "Mobile money": "MOBILE_MONEY",
  "Bank transfer": "BANK_TRANSFER",
} as const;

// ---- seed ----------------------------------------------------------------

async function main() {
  // 1. Wipe in dependency order: children before the rows they point at.
  await prisma.payment.deleteMany();
  await prisma.instalment.deleteMany();
  await prisma.traveller.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.departure.deleteMany();
  await prisma.itineraryDay.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.customer.deleteMany();

  // 2. Settings: the single row.
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      fixedRate: USD_TO_GHS,
      displayCurrencies: ["GBP", "EUR"],
      enabledMethods: ["CARD", "MOBILE_MONEY", "BANK_TRANSFER"],
    },
  });

  // 3. Optional Owner login (password is set in the auth step).
  const ownerEmail = process.env.SEED_OWNER_EMAIL;
  if (ownerEmail) {
    await prisma.user.upsert({
      where: { email: ownerEmail },
      update: { role: "OWNER" },
      create: { email: ownerEmail, name: "Owner", role: "OWNER" },
    });
  }

  // 4. Trips, each with its itinerary and one departure.
  const departureBySlug = new Map<string, string>();
  for (const t of trips) {
    const detail = getDetail(t);
    const admin = adminTrips.find((a) => a.slug === t.slug);
    const trip = await prisma.trip.create({
      data: {
        slug: t.slug,
        title: t.title,
        destination: t.location.split("·").map((p) => titleCase(p.trim())).join(" · "),
        type: t.type === "ghana" ? "GHANA" : "ABROAD",
        tags: t.tags.map((tag) => tag.toUpperCase() as "BEACH" | "HERITAGE" | "FAMILY"),
        overview: detail.overview,
        highlights: detail.highlights,
        included: detail.included,
        coverImage: t.image,
        gallery: detail.gallery,
        priceUsdCents: cents(t.priceUsd),
        priceGhsPesewas: pesewas(t.priceUsd),
        status: admin?.status === "Draft" ? "DRAFT" : "PUBLISHED",
        seoTitle: t.title,
        itinerary: {
          create: detail.itinerary.map((d, i) => ({ position: i + 1, title: d.title, body: d.body })),
        },
        departures: {
          create: {
            startsOn: new Date(`${t.startsOn}T00:00:00Z`),
            endsOn: addDays(t.startsOn, t.nights),
            seatsTotal: admin?.seatsTotal ?? 12,
          },
        },
      },
      include: { departures: true },
    });
    departureBySlug.set(t.slug, trip.departures[0].id);
  }

  // 5. Bookings with travellers, instalments (owed) and payments (received).
  for (const b of adminBookings) {
    const trip = findTrip(b.trip);
    if (!trip) throw new Error(`No trip matches booking ${b.ref}: "${b.trip}"`);

    const [firstName, ...rest] = b.customer.split(" ");
    const lastName = rest.join(" ");
    const known = adminCustomers.find((c) => c.name === b.customer);
    const customer = await prisma.customer.upsert({
      where: { email: `${b.customer.toLowerCase().replace(/\s+/g, ".")}@example.com` },
      update: {},
      create: {
        firstName,
        lastName,
        email: `${b.customer.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        residenceCountry: known?.country ?? "Ghana",
      },
    });

    const currency = trip.type === "ghana" ? "GHS" : "USD";
    const rows = adminPayments.filter((p) => p.ref === b.ref);

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        departureId: departureBySlug.get(trip.slug)!,
        totalUsdCents: cents(b.totalUsd),
        currency,
        fxRateLocked: USD_TO_GHS,
        depositPct: 30,
        cancelledAt: b.cancelled ? new Date("2026-11-15T00:00:00Z") : null,
        travellers: {
          create: Array.from({ length: b.travellers }, (_, i) =>
            i === 0
              ? { firstName, lastName, isLead: true }
              : { firstName: "Guest", lastName: String(i + 1) },
          ),
        },
        instalments: {
          create: b.schedule.map((s, i) => ({
            position: i + 1,
            label: s.label,
            amountUsdCents: cents(s.amountUsd),
            dueOn: labelToDate(s.due),
          })),
        },
      },
    });

    // Paid schedule items become PAID ledger rows.
    for (const s of b.schedule.filter((s) => s.paid)) {
      const match = rows.find((p) => p.status === "Paid");
      const paidIn = match?.currency ?? currency;
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amountUsdCents: cents(s.amountUsd),
          currency: paidIn,
          amountMinor: paidIn === "GHS" ? pesewas(s.amountUsd) : cents(s.amountUsd),
          fxRate: USD_TO_GHS,
          method: METHOD[match?.method ?? "Card"],
          status: "PAID",
          paidAt: new Date("2026-11-20T12:00:00Z"),
        },
      });
    }

    // Failed and pending attempts from the dummy payments table.
    for (const p of rows.filter((p) => p.status !== "Paid")) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amountUsdCents: cents(p.amount),
          currency: p.currency,
          amountMinor: p.currency === "GHS" ? pesewas(p.amount) : cents(p.amount),
          fxRate: USD_TO_GHS,
          method: METHOD[p.method],
          status: p.status === "Failed" ? "FAILED" : "PENDING",
        },
      });
    }
  }

  console.log(
    `Seeded ${trips.length} trips, ${adminBookings.length} bookings and a settings row.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
