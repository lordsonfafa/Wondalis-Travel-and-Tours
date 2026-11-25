import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { Button } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { getBooking } from "@/lib/data/bookings";
import { getTrip, placeName } from "@/lib/data/trips";
import { money } from "@/lib/money";
import { getFxRate } from "@/lib/fx";

// Account pages are private: keep them out of search results.
export const metadata: Metadata = {
  title: "Booking details",
  robots: { index: false, follow: false },
};

const gutter = "px-5 md:px-12 lg:px-24";
const card = "rounded-lg border border-border bg-white p-6 sm:p-8";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 text-base leading-6">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

async function BookingContent({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { ref } = await params;
  const { paid } = await searchParams;
  const booking = getBooking(ref);
  if (!booking) notFound();

  const { title, dates, travellers, totalUsd, paidUsd, currency, image, slug, when, history, balanceDue } =
    booking;
  const rate = await getFxRate(); // TODO step 6: use the booking's locked rate
  const m = (n: number) => money(n, currency, rate);
  const balanceUsd = Math.max(0, totalUsd - paidUsd);
  const settled = balanceUsd === 0;
  const pct = Math.min(100, Math.round((paidUsd / totalUsd) * 100));
  const trip = slug ? getTrip(slug) : undefined;

  return (
    <div className={`mx-auto flex max-w-[1440px] flex-col gap-8 pb-20 pt-10 lg:pb-[120px] lg:pt-12 ${gutter}`}>
      <Link
        href="/account/bookings"
        className="animate-fade-up w-fit text-[15px] font-semibold leading-5 text-forest-700 hover:text-forest-900"
      >
        ← My bookings
      </Link>

      {paid === "1" && (
        <p
          role="status"
          className="animate-fade-up rounded-[12px] bg-[#e3f2e8] px-5 py-4 text-base text-[#2e7d4f]"
        >
          Payment received. Thank you, a receipt is on its way to your email.
        </p>
      )}

      <div className="animate-fade-up flex flex-col gap-2">
        <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">{booking.ref}</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
          {title}
        </h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_440px]">
        <section aria-label="Trip" className={`${card} flex flex-col gap-6`}>
          <div className="relative h-56 w-full overflow-hidden rounded-[16px] sm:h-72">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover"
            />
          </div>
          <dl className="flex flex-col gap-4">
            <Row label="Dates" value={dates} />
            <Row label="Travellers" value={`${travellers} ${travellers === 1 ? "adult" : "adults"}`} />
            <Row label="Status" value={when === "upcoming" ? "Upcoming" : "Completed"} />
          </dl>
          <div className="flex flex-wrap gap-3">
            {trip && when === "upcoming" && (
              <AddToCalendarButton
                title={trip.title}
                startsOn={trip.startsOn}
                nights={trip.nights}
                reference={booking.ref}
                location={placeName(trip)}
              />
            )}
            {slug && (
              <Button href={`/trips/${slug}`} variant="secondary">
                View trip page
              </Button>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section aria-label="Payment" className={`${card} flex flex-col gap-5`}>
            <h2 className="font-sans text-xl font-semibold leading-7 text-forest-900">Payment</h2>
            <div
              role="progressbar"
              aria-label="Amount paid"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 w-full overflow-hidden rounded-full bg-border"
            >
              <div className={`h-full ${settled ? "bg-[#2e7d4f]" : "bg-gold-500"}`} style={{ width: `${pct}%` }} />
            </div>
            <dl className="flex flex-col gap-3">
              <Row label="Trip total" value={m(totalUsd)} />
              <Row label="Paid so far" value={m(paidUsd)} />
              <div className="h-px w-full bg-border" />
              <div className="flex items-start justify-between gap-6 text-xl font-semibold leading-7 text-forest-900">
                <dt>{settled ? "Fully paid" : "Balance"}</dt>
                <dd>{settled ? "✓" : m(balanceUsd)}</dd>
              </div>
              {!settled && balanceDue && <Row label="Due by" value={balanceDue} />}
            </dl>
            {!settled && (
              <Button href={`/account/bookings/${booking.ref}/pay`} className="w-full">
                Pay balance
              </Button>
            )}
          </section>

          <section aria-label="Payment history" className={`${card} flex flex-col gap-4`}>
            <h2 className="font-sans text-xl font-semibold leading-7 text-forest-900">Payment history</h2>
            <ul className="flex flex-col gap-3">
              {history.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-4 text-base leading-6">
                  <span className="text-ink-secondary">
                    {h.date} · {h.method}
                  </span>
                  <span className="text-ink">{m(h.amountUsd)}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/cancellation-policy"
              className="w-fit text-[15px] font-semibold leading-5 text-forest-700 hover:text-forest-900"
            >
              Cancellation policy
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  return (
    <>
      <Nav />
      <main>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <BookingContent params={params} searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
