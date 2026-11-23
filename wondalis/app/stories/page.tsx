import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { PageShell, Section } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Traveller stories",
  description: "Hear from travellers who booked trips in Ghana and abroad with Wondalis Travel & Tour.",
  alternates: { canonical: "/stories" },
};

// PLACEHOLDER stories: replace with real, permissioned traveller quotes and photos.
const stories = [
  {
    quote: "Everything was handled. We just showed up and enjoyed Accra.",
    name: "Ama K.",
    from: "London",
    trip: "Accra Beach & Nightlife Week",
    image: "/images/trip-accra.png",
  },
  {
    quote: "Cape Coast hit different with a guide who knew the history.",
    name: "Daniel O.",
    from: "Toronto",
    trip: "Heritage & Roots: Cape Coast",
    image: "/images/trip-cape-coast.png",
  },
  {
    quote: "Paying the deposit first made planning with family so much easier.",
    name: "Efua M.",
    from: "Houston",
    trip: "Kakum & Volta Adventure",
    image: "/images/trip-kakum-volta.png",
  },
];

export default function StoriesPage() {
  return (
    <PageShell title="Traveller stories" intro="Real trips, in their words.">
      <Section>
        <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((s, i) => (
            <li key={s.name}>
              <Reveal delay={(i % 3) * 120}>
                <figure className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white">
                  <div className="relative h-48 w-full">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <blockquote className="flex-1 p-6 font-serif text-xl leading-7 text-forest-900">
                    “{s.quote}”
                  </blockquote>
                  <figcaption className="px-6 pb-6 text-sm leading-5 text-ink-secondary">
                    {s.name}, {s.from} · {s.trip}
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <Button href="/trips">Plan your trip</Button>
        </div>
      </Section>
    </PageShell>
  );
}
