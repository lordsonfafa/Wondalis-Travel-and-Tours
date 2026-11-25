// A signed-in customer's own bookings. Every query is filtered by the SESSION's user id,
// never by an id or email that came from the URL or the form, so nobody can read someone else's booking.

import { prisma } from "@/lib/prisma";
import { holdsSeats } from "@/lib/booking";
import { dateLabel } from "@/lib/db/trips";
import { formatRef } from "@/lib/pricing";
import type { Booking } from "@/lib/data/bookings";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;
const day = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const methodLabel = { CARD: "Card", MOBILE_MONEY: "Mobile money", BANK_TRANSFER: "Bank transfer" } as const;

const include = {
  departure: { include: { trip: true } },
  travellers: { select: { id: true } },
  instalments: { orderBy: { position: "asc" as const } },
  payments: { where: { status: "PAID" as const }, orderBy: { paidAt: "desc" as const } },
};

type Row = NonNullable<Awaited<ReturnType<typeof findRow>>>;

function findRow(userId: string, refNumber: number) {
  return prisma.booking.findFirst({ where: { refNumber, customer: { userId }, ...holdsSeats(new Date()) }, include });
}

function toBooking(row: Row): Booking {
  const { departure } = row;
  const { trip } = departure;
  const paidCents = row.payments.reduce((sum, p) => sum + p.amountUsdCents, 0);

  // Pay the instalments in order; the first one not fully covered is the next due date.
  let covered = paidCents;
  let nextDue: Date | null = null;
  for (const inst of row.instalments) {
    if (covered >= inst.amountUsdCents) {
      covered -= inst.amountUsdCents;
    } else {
      nextDue = inst.dueOn;
      break;
    }
  }

  const year = departure.startsOn.getUTCFullYear();
  return {
    ref: formatRef(row.refNumber),
    slug: trip.status === "PUBLISHED" ? trip.slug : undefined,
    title: trip.title,
    dates: `${dateLabel(departure.startsOn, departure.endsOn)}, ${year}`,
    startsOn: departure.startsOn.toISOString().slice(0, 10),
    nights: Math.round((departure.endsOn.getTime() - departure.startsOn.getTime()) / DAY_MS),
    place: trip.type === "GHANA" ? "Ghana" : titleCase(trip.destination.split("·")[0].trim()),
    travellers: row.travellers.length,
    totalUsd: row.totalUsdCents / 100,
    paidUsd: paidCents / 100,
    currency: row.currency,
    rate: row.fxRateLocked.toNumber(),
    image: trip.coverImage,
    when: departure.endsOn >= new Date(new Date().toISOString().slice(0, 10)) ? "upcoming" : "past",
    balanceDue: nextDue ? day(nextDue) : undefined,
    history: row.payments.map((p) => ({
      date: day(p.paidAt ?? p.createdAt),
      amountUsd: p.amountUsdCents / 100,
      method: methodLabel[p.method],
    })),
  };
}

export async function getMyBookings(userId: string): Promise<Booking[]> {
  const rows = await prisma.booking.findMany({
    where: { customer: { userId }, ...holdsSeats(new Date()) },
    include,
    orderBy: { departure: { startsOn: "asc" } },
  });
  return rows.map(toBooking);
}

/** `ref` is the "WTT-000123" text from the URL. Returns null for anything that is not this customer's booking. */
export async function getMyBooking(userId: string, ref: string): Promise<Booking | null> {
  const m = /^WTT-(\d{1,9})$/.exec(ref);
  if (!m) return null;
  const row = await findRow(userId, Number(m[1]));
  return row ? toBooking(row) : null;
}
