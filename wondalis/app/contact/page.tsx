import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageShell, Section } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Talk to Wondalis Travel & Tour in Accra, Ghana. Reach us on WhatsApp, by email or send a message.",
  alternates: { canonical: "/contact" },
};

// TODO: replace with the client's real details.
const details = [
  { label: "WHERE", value: "Accra, Ghana", href: undefined },
  { label: "WHATSAPP", value: "+233 00 000 0000", href: "#" },
  { label: "EMAIL", value: "hello@wondalis.com", href: "mailto:hello@wondalis.com" },
  { label: "INSTAGRAM", value: "@wondalis", href: "#" },
];

const mapQuery = "Accra, Ghana";

export default function ContactPage() {
  return (
    <PageShell title="Contact us" intro="Questions about a trip, a payment or a group? Ask away.">
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <ul className="flex flex-col gap-6">
            {details.map((d) => (
              <li key={d.label} className="flex flex-col gap-1">
                <span className="text-xs font-bold leading-4 tracking-[2px] text-ink-secondary">
                  {d.label}
                </span>
                {d.href ? (
                  <a href={d.href} className="font-serif text-2xl font-semibold text-forest-900 hover:text-forest-500">
                    {d.value}
                  </a>
                ) : (
                  <span className="font-serif text-2xl font-semibold text-forest-900">{d.value}</span>
                )}
              </li>
            ))}
          </ul>
          <ContactForm />
        </div>
      </Section>

      <Section className="pt-0!">
        <div className="overflow-hidden rounded-lg border border-border">
          {/* TODO: replace the query with the client's exact office address */}
          <iframe
            title="Wondalis office location on Google Maps"
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[320px] w-full md:h-[420px]"
          />
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-[15px] font-semibold text-forest-900 underline"
        >
          Open in Google Maps
        </a>
      </Section>
    </PageShell>
  );
}
