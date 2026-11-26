import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell, Section } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { getPastTrips } from "@/lib/db/trips";

export const metadata: Metadata = {
  title: "Experiences",
  description:
    "Beach days, heritage tours, family trips and getaways abroad. Find the kind of trip you want with Wondalis Travel & Tour.",
  alternates: { canonical: "/experiences" },
};

// Each experience links to the Trips page with the matching filter.
const experiences = [
  { title: "Beach & nightlife", text: "Sun, sea and Accra after dark.", filter: "beach", image: "/images/trip-accra.png" },
  { title: "Heritage & roots", text: "Walk the places that shaped the story.", filter: "heritage", image: "/images/trip-cape-coast.png" },
  { title: "Family trips", text: "Easy plans for every age.", filter: "family", image: "/images/trip-kakum-volta.png" },
  { title: "Beyond Ghana", text: "Island and city escapes abroad.", filter: "abroad", image: "/images/trip-zanzibar.png" },
];

export default async function ExperiencesPage() {
  const past = await getPastTrips(); // cached; trips move here by themselves once their return date passes
  return (
    <PageShell title="Experiences" intro="Start with the kind of trip you want.">
      <Section>
        <ul className="grid gap-8 md:grid-cols-2">
          {experiences.map((e, i) => (
            <li key={e.filter}>
              <Reveal delay={(i % 2) * 120}>
                <Link
                  href={`/trips?filter=${e.filter}`}
                  className="group relative block h-80 overflow-hidden rounded-lg"
                >
                  <Image
                    src={e.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-900/85 via-forest-900/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-8">
                    <h2 className="font-serif text-[28px] font-semibold leading-9 text-ivory">
                      {e.title}
                    </h2>
                    <p className="text-base text-ivory/85">{e.text}</p>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {past.length > 0 && (
        <Section className="!pt-0">
          <div className="flex flex-col gap-3 pb-8">
            <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">WHERE WE HAVE BEEN</p>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
              Trips we have taken
            </h2>
            <p className="max-w-2xl text-lg leading-7 text-ink-secondary">
              Photos and stories from past Wondalis trips. Like what you see? Your seat on the next one is a few clicks away.
            </p>
          </div>
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {past.map((t, i) => (
              <li key={t.slug}>
                <Reveal delay={(i % 3) * 100}>
                  <Link
                    href={`/experiences/${t.slug}`}
                    className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-16px_rgba(11,42,36,0.28)]"
                  >
                    <div className="relative h-60 w-full overflow-hidden">
                      <Image
                        src={t.cover}
                        alt={t.title}
                        fill
                        sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-ivory px-3.5 py-2 text-sm leading-5 text-forest-900">
                        {t.dates}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 p-6">
                      <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">
                        {t.destination.toUpperCase()}
                      </p>
                      <h3 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">{t.title}</h3>
                      {t.note && <p className="line-clamp-2 text-base leading-6 text-ink-secondary">{t.note}</p>}
                      <span className="pt-1 text-[15px] font-semibold text-forest-900 underline">See the trip</span>
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </PageShell>
  );
}
