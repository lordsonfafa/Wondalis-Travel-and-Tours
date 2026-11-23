import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { PageShell, Section } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Payment plans",
  description:
    "Reserve any Wondalis trip with a 30% deposit and pay the balance later. Pay by card, mobile money or bank transfer in USD or GHS.",
  alternates: { canonical: "/payment-plans" },
};

// Placeholder rules: confirm the deposit, due date and instalment policy with Wondalis.
const steps = [
  { title: "Reserve", text: "Pay a 30% deposit to hold your spot." },
  { title: "Pay the balance", text: "Pay the rest any time from My bookings, in one go or in parts." },
  { title: "Travel", text: "The balance is due 30 days before departure." },
];

const methods = [
  { title: "Card", text: "Visa and Mastercard, for travellers abroad." },
  { title: "Mobile money", text: "MTN MoMo, Telecel Cash and AirtelTigo." },
  { title: "Bank transfer", text: "We confirm your transfer and update your booking." },
];

export default function PaymentPlansPage() {
  return (
    <PageShell
      title="Payment plans"
      intro="Hold your spot with a deposit, then pay the rest at your pace."
    >
      <Section>
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-border bg-white p-8">
              <span className="flex size-10 items-center justify-center rounded-full bg-gold-500 font-semibold text-forest-900">
                {i + 1}
              </span>
              <h2 className="mt-5 font-serif text-[28px] font-semibold leading-9 text-forest-900">
                {s.title}
              </h2>
              <p className="mt-2 text-base leading-6 text-ink-secondary">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="pt-0!">
        <h2 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
          Ways to pay
        </h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {methods.map((m) => (
            <li key={m.title} className="rounded-lg bg-sand p-8">
              <h3 className="font-serif text-xl font-semibold text-forest-900">{m.title}</h3>
              <p className="mt-2 text-base leading-6 text-ink-secondary">{m.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-base text-ink-secondary">
          All trips are priced in US dollars and Ghana cedis.
        </p>
        <div className="mt-10">
          <Button href="/trips">Find a trip</Button>
        </div>
      </Section>
    </PageShell>
  );
}
