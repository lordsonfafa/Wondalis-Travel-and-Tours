import { money, tripCurrency, USD_TO_GHS } from "@/lib/money";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/Button";
import { BookingCard } from "@/components/BookingCard";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { departureLabel } from "@/lib/data/trips";
import { getTrips, getTripBySlug } from "@/lib/db/trips";

type Props = { params: Promise<{ slug: string }> };

const gutter = "px-5 md:px-12 lg:px-24";
const eyebrow = "text-xs font-bold leading-4 tracking-[2px]";
const h2 = "font-serif text-[28px] font-semibold leading-9 text-forest-900";
const pill =
  "inline-flex items-center rounded-full border border-border bg-white px-5 py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] text-forest-900";

export async function generateStaticParams() {
  const trips = await getTrips();
  return trips.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getTripBySlug(slug);
  if (!found) return {};
  const { trip, detail: { overview, gallery } } = found;
  return {
    title: trip.title,
    description: overview,
    alternates: { canonical: `/trips/${slug}` },
    openGraph: { title: trip.title, description: overview, images: [gallery[0]] },
  };
}

async function TripContent({ params }: Props) {
  const { slug } = await params;
  const found = await getTripBySlug(slug);
  if (!found) notFound();
  const { trip, detail } = found;
  const site = "https://wondalis.com"; // TODO: real domain

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: trip.title,
      description: detail.overview,
      image: `${site}${detail.gallery[0]}`,
      touristType: trip.tags,
      offers: {
        "@type": "Offer",
        price: tripCurrency(trip.type) === "GHS" ? trip.priceUsd * USD_TO_GHS : trip.priceUsd,
        priceCurrency: tripCurrency(trip.type),
        availability: "https://schema.org/InStock",
        url: `${site}/trips/${trip.slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site },
        { "@type": "ListItem", position: 2, name: "Trips", item: `${site}/trips` },
        { "@type": "ListItem", position: 3, name: trip.title },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Title block */}
        <header
          className={`animate-fade-up mx-auto flex max-w-[1440px] flex-col items-start gap-3.5 pb-8 pt-10 lg:pt-12 ${gutter}`}
        >
          <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm leading-5 text-ink-secondary">
            <Link href="/" className="hover:text-forest-900">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href="/trips" className="hover:text-forest-900">
              Trips
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{trip.title}</span>
          </nav>
          <p className={`${eyebrow} text-forest-500`}>
            {trip.location} · {trip.dates.toUpperCase()}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900 lg:text-[56px] lg:leading-[64px]">
            {trip.title}
          </h1>
          <div className="flex flex-wrap gap-3">
            <span className={pill}>{trip.nights} nights</span>
            <span className={pill}>Small group</span>
          </div>
        </header>

        {/* Gallery */}
        <section
          aria-label="Photos"
          className={`mx-auto grid max-w-[1440px] gap-3 lg:grid-cols-[800fr_436fr] ${gutter}`}
        >
          <div className="relative h-64 overflow-hidden rounded-lg sm:h-96 lg:h-[480px]">
            <Image
              src={detail.gallery[0]}
              alt={trip.title}
              fill
              priority
              sizes="(min-width: 1024px) 800px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-2">
            {detail.gallery.slice(1).map((src) => (
              <div key={src} className="relative h-36 overflow-hidden rounded-lg sm:h-52 lg:h-auto">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 436px, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Details + booking */}
        <div
          className={`mx-auto flex max-w-[1440px] flex-col gap-12 pb-20 pt-12 lg:flex-row lg:items-start lg:pb-28 lg:pt-16 ${gutter}`}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-14">
            <Reveal>
              <section className="flex flex-col gap-4">
                <h2 className={h2}>Overview</h2>
                <p className="text-lg leading-7 text-ink-secondary">{detail.overview}</p>
              </section>
            </Reveal>

            <Reveal>
              <section className="flex flex-col gap-4">
                <h2 className={h2}>Highlights</h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {detail.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-center gap-3 rounded-[16px] border border-border bg-white p-5 text-base text-ink"
                    >
                      <Image src="/icons/star-nav.svg" alt="" width={18} height={18} className="shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>

            <Reveal>
              <section className="flex flex-col gap-3">
                <h2 className={`${h2} mb-1`}>Itinerary</h2>
                {detail.itinerary.map((day, i) => (
                  <details
                    key={day.title}
                    open={i === 0}
                    className="group rounded-[16px] border border-border bg-white px-6 py-5 transition-colors open:bg-gold-100"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className={`${eyebrow} text-forest-500`}>DAY {i + 1}</span>
                        <span className="text-xl font-semibold leading-7 text-forest-900">
                          {day.title}
                        </span>
                      </span>
                      <span aria-hidden className="font-serif text-[28px] leading-9 text-forest-900 group-open:hidden">
                        +
                      </span>
                      <span aria-hidden className="hidden font-serif text-[28px] leading-9 text-forest-900 group-open:inline">
                        –
                      </span>
                    </summary>
                    <p className="mt-2.5 text-base leading-6 text-ink-secondary">{day.body}</p>
                  </details>
                ))}
              </section>
            </Reveal>

            <Reveal>
              <section className="flex flex-col gap-4">
                <h2 className={h2}>What is included</h2>
                <h3 className="font-sans text-xl font-semibold leading-7 text-forest-900">Included</h3>
                <ul className="flex flex-col gap-3">
                  {detail.included.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-base text-ink-secondary">
                      <Image src="/icons/star-nav.svg" alt="" width={14} height={14} className="shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          </div>

          <div id="book" className="w-full shrink-0 scroll-mt-24 lg:sticky lg:top-28 lg:w-[408px]">
            <BookingCard
              slug={trip.slug}
              priceUsd={trip.priceUsd}
              currency={tripCurrency(trip.type)}
              departure={departureLabel(trip)}
            />
          </div>
        </div>

      {/* Mobile: price and main action stay in view, as in the mobile design. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-ivory px-5 py-4 shadow-[0_-8px_24px_rgba(11,42,36,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm leading-5 text-ink-secondary">From</span>
            <span className="font-serif text-2xl font-semibold leading-8 text-forest-900">
              {money(trip.priceUsd, tripCurrency(trip.type))}
            </span>
          </div>
          <Button href="#book" className="flex-1 sm:flex-none">
            Reserve my spot
          </Button>
        </div>
      </div>
    </>
  );
}

export default function TripDetailPage({ params }: Props) {
  return (
    <>
      <Nav />
      <main>
        <Suspense fallback={<div className="min-h-screen" />}>
          <TripContent params={params} />
        </Suspense>
      </main>
      <Footer />
      <div aria-hidden className="h-[85px] lg:hidden" />
    </>
  );
}