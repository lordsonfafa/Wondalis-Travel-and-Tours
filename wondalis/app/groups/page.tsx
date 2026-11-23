import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { PageShell, Section } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Groups & weddings",
  description:
    "Group trips, weddings, events and family reunions in Ghana and abroad, planned by Wondalis Travel & Tour.",
  alternates: { canonical: "/groups" },
};

const offers = [
  { title: "Group trips", text: "Friends, clubs and teams travelling together." },
  { title: "Weddings & events", text: "Destination weddings and celebrations in Ghana." },
  { title: "Family reunions", text: "One plan for every generation, in one place." },
];

export default function GroupsPage() {
  return (
    <PageShell
      title="Groups & weddings"
      intro="Tell us your dates and group size and we will plan the rest."
    >
      <Section>
        <ul className="grid gap-6 md:grid-cols-3">
          {offers.map((o, i) => (
            <li key={o.title}>
              <Reveal delay={i * 120} className="h-full">
                <div className="h-full rounded-lg border border-border bg-white p-8">
                  <h2 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
                    {o.title}
                  </h2>
                  <p className="mt-2 text-base leading-6 text-ink-secondary">{o.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <Button href="/contact">Request a quote</Button>
        </div>
      </Section>
    </PageShell>
  );
}
