import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { TripCard } from "@/components/TripCard";
import {
  departureMonths,
  monthKey,
  monthLabel,
  trips,
  type Trip,
  type TripTag,
} from "@/lib/data/trips";

export const metadata = {
  title: "Find your next trip",
  description:
    "Browse trips in Ghana and abroad. Filter by destination, theme and date, then reserve with a deposit.",
  alternates: { canonical: "/trips" },
};

const filters = [
  { label: "All", value: "all" },
  { label: "In Ghana", value: "ghana" },
  { label: "Abroad", value: "abroad" },
  { label: "Beach", value: "beach" },
  { label: "Heritage", value: "heritage" },
  { label: "Family", value: "family" },
] as const;

const sorts = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
] as const;

type SearchParams = Promise<{ filter?: string; sort?: string; month?: string; state?: string }>;

const gutter = "px-5 md:px-12 lg:px-24";

const chipBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors";
const chipIdle =
  "border border-border bg-white text-forest-900 hover:border-forest-900";
const chipActive = "bg-forest-900 text-ivory";
const summaryCls = `${chipBase} ${chipIdle} cursor-pointer list-none [&::-webkit-details-marker]:hidden`;
const menuCls =
  "absolute right-0 z-20 mt-2 w-56 rounded-md border border-border bg-white p-2 shadow-lg";
const itemCls = "block rounded-sm px-4 py-2.5 text-[15px] transition-colors hover:bg-sand";

type Query = { filter: string; sort: string; month: string };

function buildHref({ filter, sort, month }: Query) {
  const p = new URLSearchParams();
  if (filter !== "all") p.set("filter", filter);
  if (month !== "any") p.set("month", month);
  if (sort !== "recommended") p.set("sort", sort);
  const q = p.toString();
  return q ? `/trips?${q}` : "/trips";
}

function matches(trip: Trip, q: Query) {
  if (q.month !== "any" && monthKey(trip) !== q.month) return false;
  if (q.filter === "all") return true;
  if (q.filter === "ghana" || q.filter === "abroad") return trip.type === q.filter;
  return trip.tags.includes(q.filter as TripTag);
}

function PageHeader() {
  return (
    <header className="bg-sand">
      <div
        className={`animate-fade-up mx-auto max-w-[1440px] py-14 lg:py-[72px] ${gutter}`}
      >
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900 lg:text-[56px] lg:leading-[64px]">
          Find your next trip
        </h1>
      </div>
    </header>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q: Query = {
    filter: filters.some((f) => f.value === sp.filter) ? sp.filter! : "all",
    sort: sorts.some((s) => s.value === sp.sort) ? sp.sort! : "recommended",
    month: departureMonths.includes(sp.month ?? "") ? sp.month! : "any",
  };

  // Dummy-data helper: ?state=empty previews the empty state. Remove with the backend.
  const visible = sp.state === "empty" ? [] : trips.filter((t) => matches(t, q));
  if (q.sort === "price-asc") visible.sort((a, b) => a.priceUsd - b.priceUsd);
  if (q.sort === "price-desc") visible.sort((a, b) => b.priceUsd - a.priceUsd);

  const currentSort = sorts.find((s) => s.value === q.sort)!;
  const monthText = q.month === "any" ? "Any date" : monthLabel(q.month);

  // Nothing matches: replace the whole page body with the empty state.
  if (visible.length === 0) {
    return (
      <EmptyState
        title="No trips match"
        actionLabel="Clear filters"
        actionHref="/trips"
        actionVariant="secondary"
      />
    );
  }

  return (
    <>
      <PageHeader />

      {/* Filter bar */}
      <div
        className={`mx-auto flex max-w-[1440px] flex-col gap-4 py-8 lg:flex-row lg:items-center lg:justify-between ${gutter}`}
      >
        <nav
          aria-label="Trip filters"
          className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0 lg:pb-0"
        >
          {filters.map((f) => (
            <Link
              key={f.value}
              href={buildHref({ ...q, filter: f.value })}
              scroll={false}
              aria-current={f.value === q.filter ? "page" : undefined}
              className={`${chipBase} ${f.value === q.filter ? chipActive : chipIdle}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Dates */}
          <details className="relative">
            <summary className={summaryCls}>Dates: {monthText}</summary>
            <ul className={menuCls}>
              {["any", ...departureMonths].map((m) => (
                <li key={m}>
                  <Link
                    href={buildHref({ ...q, month: m })}
                    scroll={false}
                    className={`${itemCls} ${
                      m === q.month ? "font-semibold text-forest-900" : "text-ink"
                    }`}
                  >
                    {m === "any" ? "Any date" : monthLabel(m)}
                  </Link>
                </li>
              ))}
            </ul>
          </details>

          {/* Sort */}
          <details className="relative">
            <summary className={summaryCls}>Sort: {currentSort.label}</summary>
            <ul className={menuCls}>
              {sorts.map((s) => (
                <li key={s.value}>
                  <Link
                    href={buildHref({ ...q, sort: s.value })}
                    scroll={false}
                    className={`${itemCls} ${
                      s.value === q.sort ? "font-semibold text-forest-900" : "text-ink"
                    }`}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      {/* Trip grid */}
      <section className={`mx-auto max-w-[1440px] pb-20 lg:pb-28 ${gutter}`}>
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((trip, i) => (
              <li key={trip.slug}>
                <Reveal delay={(i % 3) * 120}>
                  <TripCard trip={trip} />
                </Reveal>
              </li>
            ))}
          </ul>
      </section>
    </>
  );
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: trips.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `https://wondalis.com/trips/${t.slug}`, // TODO: real domain
    name: t.title,
  })),
};

export default function TripsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />

      <main>
        <Suspense fallback={<><PageHeader /><div className="min-h-[600px]" /></>}>
          <Results searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
