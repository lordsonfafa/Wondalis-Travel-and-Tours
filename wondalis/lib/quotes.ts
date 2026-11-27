// Custom trips: a customer picks places, staff reply with a price, the customer accepts and pays.
// Paying reuses the normal booking and Paystack flow: an accepted quote becomes a Booking on a
// private "custom" Trip (never public), so receipts, the webhook and the admin Payments page all work unchanged.

import { randomBytes } from "node:crypto";
import { cancelUnpaidBooking, CheckoutError } from "@/lib/booking";
import { effectiveRate, getSettings } from "@/lib/fx";
import { depositUsdCents, toMinor } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOLD_CARD_MS = 30 * 60 * 1000;
const HOLD_BANK_MS = 48 * 60 * 60 * 1000;
const MAX_OPEN_HOLDS = 3;

export const formatQuoteRef = (n: number) => `QR-${String(n).padStart(6, "0")}`;
export const newToken = () => randomBytes(18).toString("hex");

export { CATEGORIES } from "@/lib/place-categories";

/** What the customer (and staff) should see, derived from the stored status, the clock and the booking. */
export type QuoteView = "waiting" | "quoted" | "expired" | "paying" | "paid" | "declined" | "cancelled";

export function quoteView(q: {
  status: string;
  validUntil: Date | null;
  booking: { cancelledAt: Date | null; holdExpiresAt: Date | null; payments: { status: string }[] } | null;
}): QuoteView {
  const now = new Date();
  switch (q.status) {
    case "NEW":
      return "waiting";
    case "QUOTED":
      return q.validUntil && q.validUntil < now ? "expired" : "quoted";
    case "ACCEPTED": {
      if (q.booking?.payments.some((p) => p.status === "PAID")) return "paid";
      const live = q.booking && !q.booking.cancelledAt && q.booking.holdExpiresAt && q.booking.holdExpiresAt > now;
      return live ? "paying" : "quoted"; // payment was abandoned: they may try again
    }
    case "DECLINED":
      return "declined";
    default:
      return "cancelled";
  }
}

export type AcceptInput = {
  token: string;
  plan: "deposit" | "full";
  method: "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER";
  userId: string | null;
};

/** The currency a quote is paid in: cedis when every place is in Ghana, otherwise dollars. */
export const quoteCurrency = (regions: string[]) => (regions.every((r) => r === "GHANA") ? ("GHS" as const) : ("USD" as const));

/**
 * Turns an accepted quote into a Booking and its first (pending) payment, in one transaction.
 * Nothing the browser sends decides the price: it comes from the quote the company saved.
 */
export async function createQuoteBooking(input: AcceptInput) {
  const now = new Date();
  const quote = await prisma.quoteRequest.findUnique({
    where: { token: input.token },
    include: { places: true, booking: { include: { payments: { select: { status: true } } } } },
  });
  if (!quote) throw new CheckoutError("This quote could not be found.");

  const view = quoteView(quote);
  if (view === "paying") throw new CheckoutError("A payment is already in progress. If you did not finish it, try again in about 30 minutes.");
  if (view === "paid") throw new CheckoutError("This quote has already been paid.");
  if (view !== "quoted" || quote.quotedUsdCents === null || quote.depositPct === null) {
    throw new CheckoutError(view === "expired" ? "This quote has expired. Please ask us for a new one." : "This quote is not open for payment.");
  }

  const settings = await getSettings(); // fresh read: the rate is about to be locked
  if (settings.enabledMethods.length > 0 && !settings.enabledMethods.includes(input.method)) {
    throw new CheckoutError("That payment method is not available right now.");
  }
  const currency = quoteCurrency(quote.places.map((p: { region: string }) => p.region));
  if (input.method === "MOBILE_MONEY" && currency !== "GHS") {
    throw new CheckoutError("Mobile money is only available for trips priced in cedis.");
  }

  const rate = effectiveRate(settings);
  const totalUsdCents: number = quote.quotedUsdCents;
  const startsOn = quote.startsOn ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endsOn = quote.endsOn && quote.endsOn >= startsOn ? quote.endsOn : startsOn;
  const balanceDueOn = new Date(startsOn.getTime() - settings.balanceDueDays * DAY_MS);

  let firstUsdCents = totalUsdCents;
  if (input.plan === "deposit") {
    if (quote.depositPct >= 100) throw new CheckoutError("This quote must be paid in full.");
    if (balanceDueOn <= now) throw new CheckoutError("The trip is soon, so it must be paid in full. Please choose “Pay in full”.");
    firstUsdCents = depositUsdCents(totalUsdCents, quote.depositPct);
  }
  const balanceUsdCents = totalUsdCents - firstUsdCents;
  const firstMinor = toMinor(firstUsdCents, currency, rate);
  const reference = randomBytes(18).toString("hex");
  const holdExpiresAt = new Date(now.getTime() + (input.method === "BANK_TRANSFER" ? HOLD_BANK_MS : HOLD_CARD_MS));

  const booking = await prisma.$transaction(async (tx) => {
    // One quote, one payment attempt at a time: a double click waits here and then sees the first one.
    await tx.$queryRaw`SELECT id FROM "QuoteRequest" WHERE id = ${quote.id} FOR UPDATE`;
    const fresh = await tx.quoteRequest.findUnique({
      where: { id: quote.id },
      include: { booking: { include: { payments: { select: { status: true } } } } },
    });
    if (!fresh || quoteView(fresh) !== "quoted") throw new CheckoutError("A payment is already in progress for this quote.");
    if (fresh.booking) await cancelUnpaidBookingIn(tx, fresh.booking.id); // an abandoned earlier attempt

    // The private trip and departure that carry this booking (created once, reused on a retry).
    let trip = fresh.tripId ? await tx.trip.findUnique({ where: { id: fresh.tripId } }) : null;
    if (!trip) {
      const names = quote.places.map((p: { name: string }) => p.name);
      const regions = quote.places.map((p: { region: string }) => p.region);
      trip = await tx.trip.create({
        data: {
          slug: `custom-${formatQuoteRef(quote.refNumber).toLowerCase()}`,
          title: `Custom trip: ${names.slice(0, 2).join(", ")}${names.length > 2 ? ` +${names.length - 2} more` : ""}`,
          destination: names.join(", ").slice(0, 200),
          type: regions.every((r: string) => r === "GHANA") ? "GHANA" : "ABROAD",
          overview: "",
          highlights: names,
          included: [],
          gallery: [],
          coverImage: "",
          priceUsdCents: totalUsdCents,
          priceGhsPesewas: Math.round(totalUsdCents * rate),
          depositPct: quote.depositPct,
          status: "DRAFT",
          isCustom: true,
        },
      });
    }
    let departure = await tx.departure.findFirst({ where: { tripId: trip.id } });
    if (departure) {
      departure = await tx.departure.update({ where: { id: departure.id }, data: { startsOn, endsOn, seatsTotal: quote.travellers } });
    } else {
      departure = await tx.departure.create({ data: { tripId: trip.id, startsOn, endsOn, seatsTotal: quote.travellers } });
    }

    const email = quote.email.toLowerCase();
    let customer = input.userId ? await tx.customer.findUnique({ where: { userId: input.userId } }) : null;
    customer ??= await tx.customer.findUnique({ where: { email } });
    customer ??= await tx.customer.create({
      data: {
        firstName: quote.firstName,
        lastName: quote.lastName,
        email,
        whatsapp: quote.whatsapp || null,
        residenceCountry: quote.residence,
        userId: input.userId,
      },
    });
    const openHolds = await tx.booking.count({
      where: { customerId: customer.id, cancelledAt: null, holdExpiresAt: { gt: now }, payments: { none: { status: "PAID" } } },
    });
    if (openHolds >= MAX_OPEN_HOLDS) throw new CheckoutError("You already have unpaid bookings in progress. Please finish or wait for them to expire.");

    const created = await tx.booking.create({
      data: {
        customerId: customer.id,
        departureId: departure.id,
        totalUsdCents,
        currency,
        fxRateLocked: rate,
        depositPct: quote.depositPct,
        holdExpiresAt,
        travellers: {
          create: [
            { firstName: quote.firstName, lastName: quote.lastName, nationality: quote.residence, isLead: true },
            ...Array.from({ length: quote.travellers - 1 }, (_, i) => ({ firstName: `Traveller ${i + 2}`, lastName: quote.lastName })),
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
    await tx.quoteRequest.update({
      where: { id: quote.id },
      data: { status: "ACCEPTED", bookingId: created.id, tripId: trip.id, respondedAt: fresh.respondedAt ?? now },
    });
    return created;
  });

  return { bookingId: booking.id, reference, currency, amountMinor: firstMinor };
}

// Same as cancelUnpaidBooking but inside the caller's transaction.
async function cancelUnpaidBookingIn(tx: { booking: { updateMany: (args: object) => Promise<unknown> } }, bookingId: string) {
  await tx.booking.updateMany({
    where: { id: bookingId, cancelledAt: null, payments: { none: { status: "PAID" } } },
    data: { cancelledAt: new Date() },
  });
}

export { cancelUnpaidBooking };
