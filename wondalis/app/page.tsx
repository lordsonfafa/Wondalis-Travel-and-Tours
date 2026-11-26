import Image from "next/image";
import { SITE_URL } from "@/lib/site";
import { Button } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { TripCard } from "@/components/TripCard";
import { monthLabel, monthsOf } from "@/lib/data/trips";
import { getTrips } from "@/lib/db/trips";

export const metadata = {
  title: "Trips in Ghana and abroad",
  description:
    "Come home to Ghana, or go further. Book curated trips in Ghana and abroad, reserve with a deposit and pay in instalments.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Wondalis Travel & Tour",
  areaServed: ["Ghana", "Worldwide"],
  url: SITE_URL,
};

const values = [
  "Secure payments",
  "Flexible instalments",
  "Local expert hosts",
  "Support on WhatsApp",
];

const steps = ["Choose your trip", "Reserve with a deposit", "Pay in instalments"];

const checklist = [
  "Airport pickup and private transfers",
  "Verified hotels and guest houses",
  "Local hosts and licensed guides",
  "Group sizes kept small and personal",
];

const gutter = "px-5 md:px-12 lg:px-24";
const eyebrow = "text-xs font-bold leading-4 tracking-[2px]";

function Star({
  size,
  className = "",
}: {
  size: number;
  className?: string;
}) {
  return (
    <Image
      src={"/icons/star-nav.svg"}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  );
}

function SearchField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 px-5 py-2 lg:pr-9">
      <span className={`${eyebrow} text-forest-500`}>{label}</span>
      <select
        name={name}
        className="cursor-pointer bg-transparent text-base text-ink outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function Home() {
  const trips = await getTrips();
  const featuredTrips = trips.slice(0, 3);
  const departureMonths = monthsOf(trips);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[640px] flex-col justify-center gap-10 overflow-hidden py-16 lg:min-h-[800px] lg:py-24">
          <Image
            src="/images/hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="ken-burns object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[rgba(11,42,36,0.92)] via-[rgba(11,42,36,0.55)] via-[55%] to-[rgba(11,42,36,0.1)]"
          />

          <div className={`relative mx-auto flex w-full max-w-[1440px] flex-col gap-10 ${gutter}`}>
            <div className="flex flex-col items-start gap-6">
              <div className="animate-fade-up flex items-center gap-2.5">
                <Star size={16} className="spin-slow" />
                <p className={`${eyebrow} text-gold-300`}>GHANA AND BEYOND</p>
              </div>
              <h1 className="animate-fade-up delay-1 max-w-[760px] font-serif text-5xl font-bold leading-[1.1] tracking-[-1px] text-ivory lg:text-[72px] lg:leading-[80px]">
                Come home for the{" "}
                <em className="font-bold italic text-gold-300">season of your life.</em>
              </h1>
              <div className="animate-fade-up delay-2 flex flex-wrap gap-4">
                <Button href="/trips" variant="gold">
                  Explore trips
                </Button>
                <Button href="/#how-it-works" variant="outline-light">
                  How it works
                </Button>
              </div>
            </div>

            <form
              action="/trips"
              className="animate-fade-up delay-3 flex w-full flex-col gap-2 rounded-lg bg-ivory p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] lg:w-fit lg:flex-row lg:items-center lg:py-3"
            >
              <SearchField
                label="DESTINATION"
                name="filter"
                options={[
                  { value: "ghana", label: "Anywhere in Ghana" },
                  { value: "abroad", label: "Abroad" },
                  { value: "all", label: "All destinations" },
                ]}
              />
              <div className="hidden h-11 w-px bg-border lg:block" />
              <SearchField
                label="DEPARTING"
                name="month"
                options={[
                  { value: "", label: "Any date" },
                  ...departureMonths.map((m) => ({ value: m, label: monthLabel(m) })),
                ]}
              />
              <div className="hidden h-11 w-px bg-border lg:block" />
              <SearchField
                label="TRAVELLERS"
                name="travellers"
                options={[
                  { value: "2", label: "2 adults" },
                  { value: "1", label: "1 adult" },
                  { value: "3", label: "3 adults" },
                  { value: "4", label: "4 adults" },
                ]}
              />
              <Button type="submit">Search trips</Button>
            </form>
          </div>
        </section>

        {/* Value strip */}
        <section className="bg-white">
          <ul
            className={`mx-auto grid max-w-[1440px] grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12 ${gutter}`}
          >
            {values.map((v, i) => (
              <li key={v}>
                <Reveal delay={i * 100} className="group flex items-start gap-4">
                  <Star
                    size={22}
                    className="transition-transform duration-500 group-hover:rotate-180"
                  />
                  <p className="text-xl font-semibold leading-7 text-forest-900">{v}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* Featured trips */}
        <section className={`mx-auto max-w-[1440px] py-20 lg:py-28 ${gutter}`}>
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3">
              <p className={`${eyebrow} text-gold-500`}>FEATURED TRIPS</p>
              <h2 className="font-serif text-4xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
                Choose your next trip
              </h2>
            </div>
            <Button href="/trips" variant="secondary">
              View all trips
            </Button>
          </Reveal>
          <ul className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredTrips.map((trip, i) => (
              <li key={trip.slug}>
                <Reveal delay={i * 130}>
                  <TripCard trip={trip} />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-sand">
          <div className={`mx-auto flex max-w-[1440px] flex-col items-center gap-14 py-20 lg:py-28 ${gutter}`}>
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <p className={`${eyebrow} text-gold-500`}>HOW IT WORKS</p>
              <h2 className="font-serif text-4xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
                From booking to boarding in three steps
              </h2>
            </Reveal>
            <ol className="grid w-full gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s}>
                  <Reveal delay={i * 130} className="h-full">
                    <div className="group flex h-full flex-col gap-4 rounded-lg border border-border bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-18px_rgba(11,42,36,0.25)]">
                      <span className="flex size-12 items-center justify-center rounded-full bg-gold-100 text-xl font-semibold leading-7 text-forest-900 transition-colors duration-300 group-hover:bg-gold-500">
                        {i + 1}
                      </span>
                      <h3 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
                        {s}
                      </h3>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why Wondalis */}
        <section
          className={`mx-auto flex max-w-[1440px] flex-col items-center gap-10 py-20 lg:flex-row lg:gap-20 lg:py-28 ${gutter}`}
        >
          <Reveal className="w-full shrink-0 lg:w-[584px]">
            <div className="relative">
              {/* gold offset frame */}
              <div
                aria-hidden
                className="absolute -bottom-4 -right-4 h-full w-full rounded-lg border-2 border-gold-500/70"
              />
              <div className="relative h-80 w-full overflow-hidden rounded-lg sm:h-[420px] lg:h-[520px]">
                <Image
                  src="/images/trip-cape-coast.png"
                  alt="Cape Coast Castle on the Ghana shoreline at sunset"
                  fill
                  sizes="(min-width: 1024px) 584px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={150} className="min-w-0 flex-1">
            <div className="flex flex-col items-start gap-6">
              <p className={`${eyebrow} text-gold-500`}>WHY WONDALIS</p>
              <h2 className="max-w-[584px] font-serif text-4xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
                Travel home with people who know the way
              </h2>
              <ul className="flex flex-col gap-3.5">
                {checklist.map((c) => (
                  <li key={c} className="flex items-center gap-3 text-base text-ink">
                    <Star size={16} />
                    {c}
                  </li>
                ))}
              </ul>
              <Button href="/trips">Plan my trip</Button>
            </div>
          </Reveal>
        </section>

        {/* CTA banner */}
        <section className="relative overflow-hidden">
          <Image
            src="/images/trip-kakum-volta.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-forest-900/80" />
          <Reveal className="relative">
            <div className="flex flex-col items-center gap-6 px-5 py-20 text-center lg:p-24">
              <Star size={28} className="spin-slow" />
              <h2 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-ivory lg:text-[56px] lg:leading-[64px]">
                Spots fill fast. Secure yours today.
              </h2>
              <Button href="/trips" variant="gold">
                Browse all trips
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}
