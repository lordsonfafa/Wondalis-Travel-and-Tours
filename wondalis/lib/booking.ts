import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { effectiveRate, getSettings } from "@/lib/fx";
import { depositUsdCents, toMinor } from "@/lib/pricing";

const HOLD_CARD_MS = 30 * 60 * 1000; // card / mobile money: 30 minutes to finish paying
const HOLD_BANK_MS = 48 * 60 * 60 * 1000; // bank transfer: 48 hours
const MAX_OPEN_HOLDS_PER_CUSTOMER = 3; // stops one person hoarding seats with unpaid bookings
const DAY_MS = 24 * 60 * 60 * 1000;

/** A booking holds its seats if it is not cancelled and (it is paid, or its hold has not expired). */
export const holdsSeats = (now: Date): Prisma.BookingWhereInput => ({
  cancelledAt: null,
  OR: [{ holdExpiresAt: { gt: now } }, { payments: { some: { status: "PAID" } } }],
});

export class CheckoutError extends Error {} // message is safe to show to the customer

export type CheckoutInput = {
  tripSlug: string;
  plan: "deposit" | "full";
  method: "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER";
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    whatsapp: string;
    residence: string;
    nationality: string;
  };
  others: { firstName: string; lastName: string }[]; // travellers 2..n
  userId: string | null; // set when the customer is signed in
};

/**
 * Creates the booking and its first (pending) payment in ONE database transaction.
 * Nothing the browser sends decides the price: the trip, rate, deposit and seat count come from the database.
 */
export async function createBooking(input: CheckoutInput) {
  const now = new Date();
  const travellers = 1 + input.others.length;

  const trip = await prisma.trip.findFirst({ where: { slug: input.tripSlug, status: "PUBLISHED" } });
  if (!trip) throw new CheckoutError("This trip is no longer available.");

  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const departure = await prisma.departure.findFirst({
    where: { tripId: trip.id, startsOn: { gte: startOfToday } },
    orderBy: { startsOn: "asc" },
  });
  if (!departure) throw new CheckoutError("This trip has no upcoming departure.");

  const settings = await getSettings(); // fresh read, not the cached copy: the rate is about to be locked
  if (settings.enabledMethods.length > 0 && !settings.enabledMethods.includes(input.method)) {
    throw new CheckoutError("That payment method is not available right now.");
  }

  const currency = trip.type === "GHANA" ? ("GHS" as const) : ("USD" as const);
  if (input.method === "MOBILE_MONEY" && currency !== "GHS") {
    throw new CheckoutError("Mobile money is only available for trips priced in cedis.");
  }

  const rate = effectiveRate(settings);
  const totalUsdCents = trip.priceUsdCents * travellers;

  let depositCents = depositUsdCents(totalUsdCents, trip.depositPct);
  const balanceDueOn = new Date(departure.startsOn.getTime() - settings.balanceDueDays * DAY_MS);
  if (input.plan === "deposit") {
    if (balanceDueOn <= now) {
      throw new CheckoutError("This trip leaves soon, so it must be paid in full. Please choose “Pay in full”.");
    }
  } else {
    depositCents = totalUsdCents;
  }
  const firstUsdCents = input.plan === "deposit" ? depositCents : totalUsdCents;
  const balanceUsdCents = totalUsdCents - firstUsdCents;
  const firstMinor = toMinor(firstUsdCents, currency, rate);

  const reference = randomBytes(18).toString("hex"); // unguessable: also acts as the key to view the confirmation page
  const holdExpiresAt = new Date(now.getTime() + (input.method === "BANK_TRANSFER" ? HOLD_BANK_MS : HOLD_CARD_MS));

  const booking = await prisma.$transaction(async (tx) => {
    // Lock this departure's row. A second customer booking the same departure waits here until we
    // commit, then counts seats again and sees the real number. Without the lock, two people could
    // both see "1 seat left" and both book it.
    await tx.$queryRaw`SELECT id FROM "Departure" WHERE id = ${departure.id} FOR UPDATE`;

    const taken = await tx.traveller.count({
      where: { booking: { departureId: departure.id, ...holdsSeats(now) } },
    });
    const left = departure.seatsTotal - taken;
    if (travellers > left) {
      throw new CheckoutError(
        left <= 0 ? "Sorry, this departure is fully booked." : `Only ${left} ${left === 1 ? "seat is" : "seats are"} left on this departure.`,
      );
    }

    const email = input.lead.email;
    let customer = input.userId ? await tx.customer.findUnique({ where: { userId: input.userId } }) : null;
    customer ??= await tx.customer.findUnique({ where: { email } });
    customer ??= await tx.customer.create({
      data: {
        firstName: input.lead.firstName,
        lastName: input.lead.lastName,
        email,
        whatsapp: input.lead.whatsapp || null,
        residenceCountry: input.lead.residence,
        userId: input.userId,
      },
    });

    const openHolds = await tx.booking.count({
      where: { customerId: customer.id, cancelledAt: null, holdExpiresAt: { gt: now }, payments: { none: { status: "PAID" } } },
    });
    if (openHolds >= MAX_OPEN_HOLDS_PER_CUSTOMER) {
      throw new CheckoutError("You already have unpaid bookings in progress. Please finish or wait for them to expire.");
    }

    const created = await tx.booking.create({
      data: {
        customerId: customer.id,
        departureId: departure.id,
        totalUsdCents,
        currency,
        fxRateLocked: rate, // from now on this booking always uses this rate
        depositPct: trip.depositPct,
        holdExpiresAt,
        travellers: {
          create: [
            { firstName: input.lead.firstName, lastName: input.lead.lastName, nationality: input.lead.nationality, isLead: true },
            ...input.others.map((o) => ({ firstName: o.firstName, lastName: o.lastName })),
          ],
        },
        instalments: {
          create:
            input.plan === "deposit"
              ? [
                  { position: 1, label: "Deposit", amountUsdCents: firstUsdCents, dueOn: null },
                  { position: 2, label: "Balance", amountUsdCents: balanceUsdCents, dueOn: balanceDueOn },
                ]
              : [{ position: 1, label: "Full payment", amountUsdCents: totalUsdCents, dueOn: null }],
        },
      },
      include: { instalments: { orderBy: { position: "asc" } } },
    });

    // What we expect to receive. The webhook only marks it PAID if Paystack reports exactly this amount.
    await tx.payment.create({
      data: {
        bookingId: created.id,
        instalmentId: created.instalments[0].id,
        amountUsdCents: firstUsdCents,
        currency,
        amountMinor: firstMinor,
        fxRate: rate,
        method: input.method,
        status: "PENDING",
        providerRef: reference,
      },
    });
    return created;
  });

  return { bookingId: booking.id, reference, currency, amountMinor: firstMinor, tripSlug: trip.slug, travellers };
}

/** Releases the seats of an unpaid booking right away (payment failed or could not be started). */
export async function cancelUnpaidBooking(bookingId: string) {
  await prisma.booking.updateMany({
    where: { id: bookingId, cancelledAt: null, payments: { none: { status: "PAID" } } },
    data: { cancelledAt: new Date() },
  });
}
