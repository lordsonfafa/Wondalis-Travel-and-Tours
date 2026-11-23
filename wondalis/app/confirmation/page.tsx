import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { Button } from "@/components/Button";
import { departureLabel, getTrip, placeName } from "@/lib/data/trips";

// Private page: keep it out of search results.
export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  trip?: string;
  travellers?: string;
  plan?: string;
  ref?: string;
}>;

const gutter = "px-5 md:px-12 lg:px-24";
const DEPOSIT_RATE = 0.3;

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 text-base leading-6">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

// Dummy flow: the booking details come from the URL. With the backend this becomes
// something like /confirmation/[bookingId] and loads the saved booking instead.
async function ConfirmationContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const trip = getTrip(sp.trip ?? "");
  if (!trip) redirect("/trips");

  const parsed = parseInt(sp.travellers ?? "2", 10);
  const travellers = Math.min(8, Math.max(1, Number.isNaN(parsed) ? 2 : parsed));
  const reference = /^WTT-\d{6}$/.test(sp.ref ?? "") ? sp.ref! : "WTT-000000";

  const total = travellers * trip.priceUsd;
  const paidToday = sp.plan === "full" ? total : Math.round(total * DEPOSIT_RATE);
  const remaining = total - paidToday;

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
          BOOKING CONFIRMED
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900 sm:text-5xl lg:text-[56px] lg:leading-[64px]">
          You are going to {placeName(trip)}!
        </h1>
      </div>

      <section
        aria-label="Booking summary"
        className="animate-fade-up delay-2 w-full max-w-[640px] rounded-lg border border-border bg-white p-6 sm:p-8"
      >
        <dl className="flex flex-col gap-5">
          <Line label="Booking reference" value={reference} />
          <Line label="Trip" value={trip.title} />
          <Line label="Dates" value={departureLabel(trip)} />
          <Line label="Travellers" value={`${travellers} ${travellers === 1 ? "adult" : "adults"}`} />
          <div className="h-px w-full bg-border" />
          <div className="flex items-start justify-between gap-6 text-xl font-semibold leading-7 text-forest-900">
            <dt>Paid today</dt>
            <dd>{usd(paidToday)}</dd>
          </div>
          {remaining > 0 && <Line label="Remaining balance" value={usd(remaining)} />}
        </dl>
      </section>

      <div className="animate-fade-up delay-3 flex flex-wrap justify-center gap-4">
        <Button href="/account/bookings">View my booking</Button>
        <AddToCalendarButton
          title={trip.title}
          startsOn={trip.startsOn}
          nights={trip.nights}
          reference={reference}
          location={placeName(trip)}
        />
      </div>
    </div>
  );
}

export default function ConfirmationPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <header className="border-b border-border bg-ivory">
        <div className={`mx-auto flex h-[88px] max-w-[1440px] items-center ${gutter}`}>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/icons/star-nav.svg" alt="" width={20} height={20} />
            <span className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
              Wondalis
            </span>
          </Link>
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
