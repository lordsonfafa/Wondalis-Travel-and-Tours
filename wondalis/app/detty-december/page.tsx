import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { PageShell, Section } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { TripCard } from "@/components/TripCard";
import { getTrips } from "@/lib/db/trips";

// Landing page for "Detty December" searches. The rest of the site stays year-round.
export const metadata: Metadata = {
  title: "Detty December trips in Ghana",
  description:
    "Plan your Detty December in Ghana: beach weeks in Accra, heritage tours and festival weekends, with a 30% deposit to reserve.",
  alternates: { canonical: "/detty-december" },
};

export default async function DettyDecemberPage() {
  const trips = await getTrips();
  const december = trips.filter((t) => t.startsOn.slice(5, 7) === "12");

  return (
    <PageShell
      title="Detty December in Ghana"
      intro="Beaches, nightlife, culture and homecoming. Reserve your December with a 30% deposit."
    >
      <Section>
        <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {december.map((trip, i) => (
            <li key={trip.slug}>
              <Reveal delay={(i % 3) * 120}>
                <TripCard trip={trip} />
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <p className="text-lg text-ink-secondary">Travelling another time of year?</p>
          <Button href="/trips" variant="secondary">
            See all trips
          </Button>
        </div>
      </Section>
    </PageShell>
  );
}
