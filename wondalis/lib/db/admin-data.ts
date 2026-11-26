// Admin-side reads for bookings, customers, payments and the dashboard. Not cached: callers must
// call requireStaff() first. Amounts are returned in USD (dollars) like the dummy data was.

import { prisma } from "@/lib/prisma";
import { holdsSeats } from "@/lib/booking";
import { formatRef } from "@/lib/pricing";
import type {
  AdminBooking,
  AdminCustomer,
  AdminPayment,
  PaymentStatus,
  ScheduleItem,
} from "@/lib/data/admin";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
const startOfToday = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};
const methodLabel = { CARD: "Card", MOBILE_MONEY: "Mobile money", BANK_TRANSFER: "Bank transfer" } as const;

// Unpaid checkouts that were abandoned (hold expired, never paid, never cancelled) are noise: hide them.
const visibleBookings = () => ({ OR: [{ cancelledAt: { not: null } }, holdsSeats(new Date())] });

const bookingInclude = {
  customer: { select: { id: true, firstName: true, lastName: true } },
  departure: { include: { trip: { select: { title: true } } } },
  travellers: { select: { id: true } },
  instalments: { orderBy: { position: "asc" as const } },
  payments: { where: { status: "PAID" as const }, select: { amountUsdCents: true } },
};

type BookingRow = Awaited<ReturnType<typeof loadBookings>>[number];

function loadBookings(limit?: number) {
  return prisma.booking.findMany({
    where: visibleBookings(),
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

const statusOf = (cancelled: boolean, totalCents: number, paidCents: number): PaymentStatus =>
  cancelled ? "Cancelled" : paidCents >= totalCents ? "Paid" : paidCents > 0 ? "Partial" : "Due";

function toAdminBooking(row: BookingRow): AdminBooking {
  const paidCents = row.payments.reduce((s, p) => s + p.amountUsdCents, 0);
  const today = startOfToday();
  let covered = paidCents; // instalments are paid off in order
  const schedule: ScheduleItem[] = row.instalments.map((inst) => {
    const paid = covered >= inst.amountUsdCents;
    const part = paid ? 0 : Math.min(covered, inst.amountUsdCents); // money already towards this line
    covered -= paid ? inst.amountUsdCents : part;
    return {
      label: inst.label,
      amountUsd: inst.amountUsdCents / 100,
      paid,
      receivedUsd: part > 0 ? part / 100 : undefined,
      due: !paid && inst.dueOn ? day(inst.dueOn) : undefined,
      overdue: !paid && !!inst.dueOn && inst.dueOn < today,
    };
  });
  return {
    id: row.id,
    ref: formatRef(row.refNumber),
    customer: `${row.customer.firstName} ${row.customer.lastName}`,
    trip: row.departure.trip.title,
    travellers: row.travellers.length,
    totalUsd: row.totalUsdCents / 100,
    paidUsd: paidCents / 100,
    cancelled: row.cancelledAt !== null,
    schedule,
  };
}

export async function listAdminBookings(): Promise<AdminBooking[]> {
  return (await loadBookings(500)).map(toAdminBooking);
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  const rows = await prisma.customer.findMany({
    include: { bookings: { where: visibleBookings(), include: bookingInclude, orderBy: { createdAt: "desc" } } },
  });
  return rows
    .filter((c) => c.bookings.length > 0)
    .map((c) => {
      let paid = 0;
      let balance = 0;
      for (const b of c.bookings) {
        const p = b.payments.reduce((s, x) => s + x.amountUsdCents, 0);
        paid += p;
        if (!b.cancelledAt) balance += Math.max(0, b.totalUsdCents - p);
      }
      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        country: c.residenceCountry,
        bookings: c.bookings.filter((b) => !b.cancelledAt).length,
        paid: paid / 100,
        balance: balance / 100,
        latestTrip: c.bookings[0].departure.trip.title,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listAdminPayments(): Promise<{ payments: AdminPayment[]; kpis: { label: string; usd?: number; value?: string }[] }> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const [rows, collected, pending, failed] = await Promise.all([
    prisma.payment.findMany({
      include: { booking: { select: { refNumber: true, customer: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.payment.aggregate({ _sum: { amountUsdCents: true }, where: { status: "PAID", paidAt: { gte: monthStart } } }),
    // Pending = bank transfers waiting for us, plus card/mobile payments started in the last 2 hours.
    prisma.payment.aggregate({
      _sum: { amountUsdCents: true },
      where: { status: "PENDING", OR: [{ method: "BANK_TRANSFER" }, { createdAt: { gte: twoHoursAgo } }] },
    }),
    prisma.payment.count({ where: { status: "FAILED", createdAt: { gte: monthStart } } }),
  ]);

  return {
    payments: rows.map((p) => ({
      id: p.id,
      date: day(p.paidAt ?? p.createdAt),
      ref: formatRef(p.booking.refNumber),
      customer: `${p.booking.customer.firstName} ${p.booking.customer.lastName}`,
      method: methodLabel[p.method],
      amount: p.amountUsdCents / 100,
      currency: p.currency,
      rate: p.fxRate.toNumber(), // the rate this payment was made at
      status: p.status === "PAID" ? "Paid" : p.status === "FAILED" ? "Failed" : "Pending",
    })),
    kpis: [
      { label: "Collected this month", usd: (collected._sum.amountUsdCents ?? 0) / 100 },
      { label: "Pending", usd: (pending._sum.amountUsdCents ?? 0) / 100 },
      { label: "Failed", value: String(failed) },
    ],
  };
}

export async function getDashboard() {
  const now = new Date();
  const today = startOfToday();

  const [revenue, active, recent, departures] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amountUsdCents: true }, where: { status: "PAID" } }),
    prisma.booking.findMany({ where: holdsSeats(now), include: { payments: { where: { status: "PAID" }, select: { amountUsdCents: true } } } }),
    loadBookings(5),
    prisma.departure.findMany({
      where: { startsOn: { gte: today }, trip: { status: "PUBLISHED" } },
      include: { trip: { select: { title: true } } },
      orderBy: { startsOn: "asc" },
    }),
  ]);

  const outstanding = active.reduce(
    (sum, b) => sum + Math.max(0, b.totalUsdCents - b.payments.reduce((s, p) => s + p.amountUsdCents, 0)),
    0,
  );

  const withSeats = await Promise.all(
    departures.map(async (d) => {
      const taken = await prisma.traveller.count({ where: { booking: { departureId: d.id, ...holdsSeats(now) } } });
      return { d, taken };
    }),
  );
  const seatsLeft = withSeats.reduce((s, x) => s + Math.max(0, x.d.seatsTotal - x.taken), 0);

  return {
    kpis: [
      { label: "Revenue collected", usd: (revenue._sum.amountUsdCents ?? 0) / 100 },
      { label: "Bookings", value: String(active.length) },
      { label: "Outstanding balances", usd: outstanding / 100 },
      { label: "Seats left", value: String(seatsLeft) },
    ] as { label: string; usd?: number; value?: string }[],
    recentBookings: recent.map((r) => {
      const b = toAdminBooking(r);
      return { ref: b.ref, customer: b.customer, trip: b.trip, paidUsd: b.paidUsd, status: statusOf(b.cancelled ?? false, r.totalUsdCents, b.paidUsd * 100) };
    }),
    departures: withSeats.slice(0, 3).map(({ d, taken }) => ({
      trip: d.trip.title,
      date: day(d.startsOn),
      bookedPct: d.seatsTotal > 0 ? Math.min(100, Math.round((taken / d.seatsTotal) * 100)) : 0,
    })),
  };
}
