import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { PageShell, Section } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about booking, deposits, payment methods, cancellations and travelling with Wondalis Travel & Tour.",
  alternates: { canonical: "/faq" },
};

// Placeholder answers: confirm every detail with Wondalis before launch.
const faqs = [
  {
    q: "How do I reserve a trip?",
    a: "Pick a trip, choose how many travellers, and pay a 30% deposit to hold your spot. You can pay the rest later from My bookings.",
  },
  {
    q: "When is the balance due?",
    a: "The balance is due 30 days before departure. We send reminders before the date.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "Cards, mobile money (MTN MoMo, Telecel Cash, AirtelTigo) and bank transfer.",
  },
  {
    q: "Can I pay in cedis?",
    a: "Yes. Every trip shows prices in US dollars and Ghana cedis.",
  },
  {
    q: "Can I cancel or change my booking?",
    a: "Yes. Refunds depend on how close you are to departure. See our cancellation policy for the details.",
  },
  {
    q: "Do you take groups, weddings and family reunions?",
    a: "Yes. Contact us with your dates and group size and we will build a plan for you.",
  },
  {
    q: "Do I need a visa for Ghana?",
    a: "Most visitors do. Requirements depend on your passport, so check with the Ghana embassy or consulate nearest you before you book.",
  },
  {
    q: "What is included in a trip?",
    a: "Each trip page lists exactly what is included, from stays and transport to activities and guides.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <PageShell title="Frequently asked questions">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Section narrow>
        <div className="flex flex-col gap-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-lg border border-border bg-white px-6 py-5 open:border-forest-500"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl font-semibold text-forest-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="text-2xl leading-none text-gold-500 transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pt-3 text-base leading-6 text-ink-secondary">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <p className="text-lg text-ink-secondary">Still have a question?</p>
          <Button href="/contact" variant="secondary">
            Contact us
          </Button>
        </div>
      </Section>
    </PageShell>
  );
}
