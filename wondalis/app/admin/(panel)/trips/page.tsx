import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/Button";
import { TripStatusPill } from "@/components/admin/TripStatusPill";
import { adminTrips, type AdminTrip } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Trips" };

const filters = [
  { label: "All", value: "all" },
  { label: "In Ghana", value: "ghana" },
  { label: "Abroad", value: "abroad" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
] as const;

type SearchParams = Promise<{ filter?: string; state?: string }>;

const chipBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-[18px] py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors";
const chipIdle = "border border-border bg-white text-forest-900 hover:border-forest-900";
const chipActive = "bg-forest-900 text-ivory";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

function matches(t: AdminTrip, filter: string) {
  if (filter === "ghana" || filter === "abroad") return t.type === filter;
  if (filter === "published") return t.status === "Published";
  if (filter === "draft") return t.status === "Draft";
  return true;
}

function Heading({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="animate-fade-up hidden font-serif text-3xl font-semibold leading-tight text-forest-900 lg:block lg:text-[40px] lg:leading-[48px]">
        Trips
      </h1>
      {children}
    </div>
  );
}

// Reads the URL, so it sits inside <Suspense>.
async function TripsContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filter = filters.some((f) => f.value === sp.filter) ? sp.filter! : "all";
  // Dummy-data helper: ?state=empty previews the empty state. Remove with the backend.
  const all = sp.state === "empty" ? [] : adminTrips;

  if (all.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-6">
        <Heading>
          <Button href="/admin/trips/new">New trip</Button>
        </Heading>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-[20px] border border-border bg-white px-5 py-16 text-center">
          <div className="flex size-[72px] items-center justify-center rounded-full bg-gold-100">
            <Image src="/icons/star-nav.svg" alt="" width={32} height={32} />
          </div>
          <p className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
            No trips yet
          </p>
          <Button href="/admin/trips/new">Create your first trip</Button>
        </div>
      </div>
    );
  }

  const visible = all.filter((t) => matches(t, filter));

  return (
    <div className="flex flex-col gap-6">
      <Heading>
        <div className="flex items-center gap-3">
          {/* Dummy period chip, same placeholder as the dashboard. */}
          <span className="rounded-full border border-border bg-white px-[18px] py-3 text-[15px] font-semibold leading-5 tracking-[0.2px] text-forest-900">
            Dec 2026
          </span>
          <Button href="/admin/trips/new">New trip</Button>
        </div>
      </Heading>

      <nav aria-label="Trip filters" className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/trips" : `/admin/trips?filter=${f.value}`}
            scroll={false}
            aria-current={f.value === filter ? "page" : undefined}
            className={`${chipBase} ${f.value === filter ? chipActive : chipIdle}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {/* Phones: one card per trip. Tables only from md up. */}
      <ul className="flex flex-col gap-3.5 md:hidden">
        {visible.map((t) => (
          <li key={t.slug} className="flex flex-col gap-3 rounded-[20px] border border-border bg-white p-[17px]">
            <Link href={`/admin/trips/${t.slug}`} className="flex items-center gap-3.5">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-[12px]">
                <Image src={t.image} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-xl font-semibold leading-7 text-forest-900">{t.title}</span>
                <span className="text-sm leading-5 text-ink-secondary">
                  {t.type === "ghana" ? "In Ghana" : "Abroad"} · {t.dates}
                </span>
              </span>
            </Link>
            <div className="flex items-center justify-between gap-3 text-base text-ink">
              <span>
                {usd(t.priceUsd)} · {t.seatsBooked} / {t.seatsTotal} seats
              </span>
              <TripStatusPill status={t.status} />
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-10 text-center text-ink-secondary">No trips match this filter.</li>
        )}
      </ul>

      <div className="relative hidden overflow-x-auto rounded-[20px] border border-border bg-white px-6 py-2 md:block">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-border text-xs font-bold leading-4 tracking-[2px] text-ink-secondary">
              <th scope="col" className="py-3 pr-4 font-bold">TRIP</th>
              <th scope="col" className="py-3 pr-4 font-bold">TYPE</th>
              <th scope="col" className="py-3 pr-4 font-bold">DATES</th>
              <th scope="col" className="py-3 pr-4 font-bold">PRICE</th>
              <th scope="col" className="py-3 pr-4 font-bold">SEATS</th>
              <th scope="col" className="py-3 pr-4 font-bold">STATUS</th>
              <th scope="col" className="py-3 font-bold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t.slug} className="border-b border-border last:border-b-0">
                <td className="py-3.5 pr-4">
                  <Link
                    href={`/admin/trips/${t.slug}`}
                    className="flex items-center gap-3.5 text-xl font-semibold leading-7 text-forest-900 hover:text-forest-500"
                  >
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-[10px]">
                      <Image src={t.image} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                    <span className="whitespace-nowrap">{t.title}</span>
                  </Link>
                </td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-ink">
                  {t.type === "ghana" ? "In Ghana" : "Abroad"}
                </td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-ink">{t.dates}</td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-ink">{usd(t.priceUsd)}</td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-ink">
                  {t.seatsBooked} / {t.seatsTotal}
                </td>
                <td className="py-3.5 pr-4">
                  <TripStatusPill status={t.status} />
                </td>
                <td className="py-3.5 text-right">
                  <Link
                    href={`/admin/trips/${t.slug}`}
                    aria-label={`Edit ${t.title}`}
                    className="text-[15px] font-semibold text-forest-900 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="py-10 text-center text-ink-secondary">No trips match this filter.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminTripsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Heading />}>
      <TripsContent searchParams={searchParams} />
    </Suspense>
  );
}