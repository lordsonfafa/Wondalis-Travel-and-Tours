import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RequestPill } from "@/components/admin/RequestPill";
import { QuoteForm } from "@/components/admin/QuoteForm";
import { requireStaff } from "@/lib/auth-guards";
import { getRequestById } from "@/lib/db/quotes";
import { getFxRate } from "@/lib/fx";

export const metadata: Metadata = { title: "Request" };

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 text-base leading-6">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const q = await getRequestById(id);
  if (!q) notFound();
  const rate = await getFxRate();
  const locked = q.view === "paid" || q.view === "paying" || q.view === "cancelled";
  // The price field is in the customer's currency: show an existing USD quote in it.
  const existing = q.quotedUsd === null ? "" : String(q.currency === "GHS" ? Math.round(q.quotedUsd * rate) : q.quotedUsd);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/requests" className="text-sm font-semibold text-forest-900 hover:underline">← All requests</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold text-forest-900">{q.ref}</h1>
        <RequestPill view={q.view} />
      </div>

      <dl className="flex flex-col gap-3 rounded-[20px] border border-border bg-white p-6">
        <Row label="Customer">{q.firstName} {q.lastName}</Row>
        <Row label="Email"><a href={`mailto:${q.email}`} className="underline">{q.email}</a></Row>
        {q.whatsapp && <Row label="WhatsApp">{q.whatsapp}</Row>}
        <Row label="Lives in">{q.residence}</Row>
        <Row label="Travellers">{q.travellers}</Row>
        <Row label="Preferred dates">{q.startsOn ? `${day(q.startsOn)}${q.endsOn ? ` to ${day(q.endsOn)}` : ""}${q.flexible ? " (flexible)" : ""}` : q.flexible ? "Flexible" : "Not given"}</Row>
        <Row label="Sent">{day(q.createdAt)}</Row>
        {q.bookingRef && <Row label="Booking">{q.bookingRef}</Row>}
      </dl>

      <section className="flex flex-col gap-3 rounded-[20px] border border-border bg-white p-6">
        <h2 className="font-serif text-2xl font-semibold text-forest-900">Places ({q.places.length})</h2>
        <ul className="flex flex-wrap gap-2">
          {q.places.map((p) => (
            <li key={p.name} className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-forest-900">
              {p.name} <span className="font-normal text-ink-secondary">· {p.region === "GHANA" ? "Ghana" : "Abroad"}</span>
            </li>
          ))}
        </ul>
        {q.notes && <p className="whitespace-pre-line pt-2 text-base leading-6 text-ink">{q.notes}</p>}
      </section>

      {locked ? (
        <p className="rounded-[20px] bg-sand p-6 text-base text-ink-secondary">
          {q.view === "cancelled" ? "This request was cancelled." : "The customer has started or finished paying, so the price can no longer be changed."}
        </p>
      ) : (
        <QuoteForm
          id={q.id}
          currency={q.currency}
          initial={{ amount: existing, depositPct: String(q.depositPct ?? 30), message: q.message }}
          canCancel={q.view !== "cancelled"}
          alreadyQuoted={q.quotedUsd !== null}
        />
      )}
    </div>
  );
}

export default function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-secondary">Loading request…</p>}>
      <Content params={params} />
    </Suspense>
  );
}
