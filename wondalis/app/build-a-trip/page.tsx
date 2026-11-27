import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell, Section } from "@/components/PageShell";
import { PlanForm } from "@/components/PlanForm";
import { getSession } from "@/lib/auth-guards";
import { getPlaces } from "@/lib/db/places";

export const metadata: Metadata = {
  title: "Build your own trip",
  description:
    "Choose the places you want to visit in Ghana or abroad, send us your selection and Wondalis Travel & Tour will price it for you.",
  alternates: { canonical: "/build-a-trip" },
};

// Reads the session (to prefill the form), so it sits inside <Suspense>.
async function PlanContent() {
  const [places, session] = await Promise.all([getPlaces(), getSession()]);
  const today = new Date().toISOString().slice(0, 10);

  if (places.length === 0) {
    return (
      <p className="max-w-xl rounded-lg bg-sand p-6 text-lg leading-7 text-ink-secondary">
        We are putting our list of places together. Please check back soon, or contact us and tell us where you would like to go.
      </p>
    );
  }
  return <PlanForm places={places} today={today} defaults={{ name: session?.user.name ?? "", email: session?.user.email ?? "" }} />;
}

export default function BuildATripPage() {
  return (
    <PageShell title="Build your own trip" intro="Choose the places you want to see. We will send you a price for the whole plan.">
      <Section>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <PlanContent />
        </Suspense>
      </Section>
    </PageShell>
  );
}
