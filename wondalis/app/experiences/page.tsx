import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell, Section } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";

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

export default function ExperiencesPage() {
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
    </PageShell>
  );
}
