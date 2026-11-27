import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/Button";
import { PageShell, Section } from "@/components/PageShell";
import { QuoteAccept } from "@/components/QuoteAccept";
import { getQuoteByToken, type QuoteDetail } from "@/lib/db/quotes";
import { getFxRate } from "@/lib/fx";
import { money } from "@/lib/money";

// Private page, reachable only through the link we email: keep it out of search results.
export const metadata: Metadata = { title: "Your trip price", robots: { index: false, follow: false } };

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 text-base leading-6">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

function Summary({ q }: { q: QuoteDetail }) {
  return (
    <dl className="flex flex-col gap-3 rounded-lg border border-border bg-white p-6">
      <Row label="Request" value={q.ref} />
      <Row label="Places" value={q.places.map((p) => p.name).join(", ")} />
      <Row label="Travellers" value={String(q.travellers)} />
      {q.startsOn && <Row label="Preferred dates" value={`${longDate(q.startsOn)}${q.endsOn ? ` to ${longDate(q.endsOn)}` : ""}${q.flexible ? " (flexible)" : ""}`} />}
      {!q.startsOn && q.flexible && <Row label="Dates" value="Flexible" />}
    </dl>
  );
}

function Notice({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3 rounded-lg bg-sand p-6">
      <h2 className="font-serif text-2xl font-semibold text-forest-900">{title}</h2>
      <p className="text-base leading-6 text-ink-secondary">{body}</p>
      {action}
    </div>
  );
}

// Reads the URL token and the database, so it sits inside <Suspense>.
async function QuoteContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const q = await getQuoteByToken(token);
  if (!q) notFound();
  const rate = await getFxRate();

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <Summary q={q} />

      {q.view === "waiting" && (
        <Notice
          title="We are preparing your price"
          body={`Thank you, ${q.firstName}. We have your request and will email ${q.email} as soon as your price is ready. Keep this page: it will show your price when we send it.`}
        />
      )}

      {q.view === "quoted" && q.quotedUsd !== null && q.validUntil && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 rounded-lg bg-forest-900 p-6 text-ivory">
            <p className="text-xs font-bold tracking-[2px] text-gold-300">YOUR PRICE</p>
            <p className="font-serif text-5xl font-semibold">{money(q.quotedUsd, q.currency, rate)}</p>
            <p className="text-sm text-on-dark-muted">For the whole plan, all {q.travellers} traveller{q.travellers === 1 ? "" : "s"}. Valid until {longDate(q.validUntil)}.</p>
            {q.message && <p className="mt-3 whitespace-pre-line text-base leading-6 text-ivory">{q.message}</p>}
          </div>
          <QuoteAccept
            token={q.token}
            currency={q.currency}
            totalLabel={money(q.quotedUsd, q.currency, rate)}
            depositLabel={q.depositPct && q.depositPct < 100 ? money((q.quotedUsd * q.depositPct) / 100, q.currency, rate) : null}
            canDeposit={!!q.depositPct && q.depositPct < 100}
          />
        </div>
      )}

      {q.view === "expired" && (
        <Notice
          title="This price has expired"
          body="Prices are held for a limited time. Contact us and we will be happy to refresh it for you."
          action={<Button href="/contact">Contact us</Button>}
        />
      )}
      {q.view === "paying" && (
        <Notice title="Payment in progress" body="You have started paying for this plan. If you were not able to finish, wait a few minutes and refresh this page to try again." />
      )}
      {q.view === "paid" && (
        <Notice
          title="Paid. Your trip is booked"
          body={`Thank you. Your booking ${q.bookingRef ?? ""} is confirmed and your receipt is on its way.`}
          action={q.paidReference ? <Link href={`/confirmation?reference=${q.paidReference}`} className="text-base font-semibold text-forest-900 underline">View your booking</Link> : undefined}
        />
      )}
      {q.view === "declined" && (
        <Notice title="You declined this price" body="No problem. You are welcome to build another plan any time." action={<Button href="/build-a-trip">Build another trip</Button>} />
      )}
      {q.view === "cancelled" && (
        <Notice title="This request was closed" body="Contact us if you would like to plan something new." action={<Button href="/build-a-trip">Build a trip</Button>} />
      )}
    </div>
  );
}

export default function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <PageShell title="Your trip price" intro="Review the price for the places you chose, then accept and pay securely.">
      <Section>
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          <QuoteContent params={params} />
        </Suspense>
      </Section>
    </PageShell>
  );
}
