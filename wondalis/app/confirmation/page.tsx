import { money } from "@/lib/money";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { Button } from "@/components/Button";
import { dateLabel } from "@/lib/db/trips";
import { formatRef } from "@/lib/pricing";
import { applyTransaction } from "@/lib/payments";
import { verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

// Private page: keep it out of search results.
export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ reference?: string; trxref?: string }>;

const gutter = "px-5 md:px-12 lg:px-24";
const DAY_MS = 24 * 60 * 60 * 1000;
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 text-base leading-6">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

function loadPayment(reference: string) {
  return prisma.payment.findUnique({
    where: { providerRef: reference },
    include: {
      booking: {
        include: {
          departure: { include: { trip: true } },
          travellers: { select: { id: true } },
          payments: { where: { status: "PAID" }, select: { amountUsdCents: true } },
          customer: { select: { email: true } },
        },
      },
    },
  });
}

// The long random reference in the URL is the key to this page (it is only ever sent to the customer),
// so a booking cannot be opened by guessing booking numbers. The page asks Paystack what happened;
// it never believes the browser's redirect on its own.
async function ConfirmationContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref ?? "";
  if (!/^[a-f0-9]{36}$/.test(reference)) redirect("/trips");

  let payment = await loadPayment(reference);
  if (!payment) redirect("/trips");

  if (payment.status === "PENDING" && payment.method !== "BANK_TRANSFER") {
    try {
      await applyTransaction(await verifyTransaction(reference));
      payment = (await loadPayment(reference)) ?? payment;
    } catch (e) {
      console.error("[confirmation] verify failed", e); // fall through: the page shows "processing" and the webhook will settle it
    }
  }

  const { booking } = payment;
  const { departure } = booking;
  const { trip } = departure;
  const travellers = booking.travellers.length;

  if (payment.status === "FAILED") {
    redirect(`/checkout/failed?trip=${trip.slug}&travellers=${travellers}`);
  }

  const rate = booking.fxRateLocked.toNumber(); // the rate locked when the booking was made
  const usd = (cents: number) => money(cents / 100, booking.currency, rate);
  const paidCents = booking.payments.reduce((sum, p) => sum + p.amountUsdCents, 0);
  const remainingCents = booking.totalUsdCents - paidCents;

  const place = trip.type === "GHANA" ? "Ghana" : titleCase(trip.destination.split("·")[0].trim());
  const nights = Math.round((departure.endsOn.getTime() - departure.startsOn.getTime()) / DAY_MS);
  const startsOn = departure.startsOn.toISOString().slice(0, 10);
  const dates = `${dateLabel(departure.startsOn, departure.endsOn)}, ${startsOn.slice(0, 4)}`;
  const ref = formatRef(booking.refNumber);

  const paid = payment.status === "PAID";
  const bank = payment.method === "BANK_TRANSFER";

  return (
    <div
      className={`mx-auto flex max-w-[1440px] flex-col items-center gap-10 pb-24 pt-16 lg:pb-32 lg:pt-24 ${gutter}`}
    >
      <div
        aria-hidden
        className="animate-fade-up flex size-[88px] items-center justify-center rounded-full bg-gold-100"
      >
        <Image src="/icons/star-nav.svg" alt="" width={36} height={36} />
      </div>

      <div className="animate-fade-up delay-1 flex flex-col items-center gap-3 text-center">
        <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">
          {paid ? "BOOKING CONFIRMED" : bank ? "SEATS RESERVED" : "PAYMENT PROCESSING"}
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900 sm:text-5xl lg:text-[56px] lg:leading-[64px]">
          {paid ? `You are going to ${place}!` : bank ? "Your seats are reserved" : "We are confirming your payment"}
        </h1>
        {!paid && (
          <p className="max-w-[560px] text-lg leading-7 text-ink-secondary">
            {bank
              ? `Our team will send the bank transfer details to ${booking.customer.email}. Your seats are held for 48 hours; the booking is confirmed once we receive your transfer.`
              : "This usually takes a few seconds. If you were charged, your booking will be confirmed automatically."}
          </p>
        )}
      </div>

      <section
        aria-label="Booking summary"
        className="animate-fade-up delay-2 w-full max-w-[640px] rounded-lg border border-border bg-white p-6 sm:p-8"
      >
        <dl className="flex flex-col gap-5">
          <Line label="Booking reference" value={ref} />
          <Line label="Trip" value={trip.title} />
          <Line label="Dates" value={dates} />
          <Line label="Travellers" value={`${travellers} ${travellers === 1 ? "adult" : "adults"}`} />
          <div className="h-px w-full bg-border" />
          <div className="flex items-start justify-between gap-6 text-xl font-semibold leading-7 text-forest-900">
            <dt>{paid ? "Paid today" : "Due now"}</dt>
            <dd>{usd(payment.amountUsdCents)}</dd>
          </div>
          {paid && remainingCents > 0 && <Line label="Remaining balance" value={usd(remainingCents)} />}
        </dl>
      </section>

      <div className="animate-fade-up delay-3 flex flex-wrap justify-center gap-4">
        {paid ? (
          <>
            <Button href="/account/bookings">View my booking</Button>
            <AddToCalendarButton title={trip.title} startsOn={startsOn} nights={nights} reference={ref} location={place} />
          </>
        ) : bank ? (
          <Button href="/trips">Browse more trips</Button>
        ) : (
          <Button href={`/confirmation?reference=${reference}`}>Refresh</Button>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <header className="border-b border-border bg-ivory">
        <div className={`mx-auto flex h-[69px] max-w-[1440px] items-center justify-between lg:h-[88px] ${gutter}`}>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/icons/star-nav.svg" alt="" width={20} height={20} />
            <span className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
              Wondalis
            </span>
          </Link>
          <p className="text-sm text-ink-secondary sm:hidden">Booking</p>
        </div>
      </header>

      <main>
        <Suspense fallback={<div className="min-h-[560px]" />}>
          <ConfirmationContent searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
