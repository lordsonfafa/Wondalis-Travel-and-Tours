import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/CheckoutForm";
import { CheckoutHeader } from "@/components/CheckoutHeader";
import { getDetail } from "@/lib/data/trip-details";
import { getTrip } from "@/lib/data/trips";

// Checkout is private: keep it out of search results.
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ trip?: string; travellers?: string }>;

const gutter = "px-5 md:px-12 lg:px-24";

const steps = ["Trip", "Traveller details", "Payment", "Confirmation"];
const CURRENT_STEP = 1;

function Stepper() {
  return (
    <ol
      aria-label="Checkout progress"
      className={`mx-auto flex max-w-[1440px] items-center gap-3 pb-2 pt-10 sm:gap-4 ${gutter}`}
    >
      {steps.map((label, i) => {
        const done = i < CURRENT_STEP;
        const active = i === CURRENT_STEP;
        return (
          <li key={label} className="flex items-center gap-3 sm:gap-4">
            {i > 0 && <span aria-hidden className="h-0.5 w-6 bg-border sm:w-16" />}
            <span className="flex items-center gap-2.5" aria-current={active ? "step" : undefined}>
              <span
                className={`flex size-8 items-center justify-center rounded-full text-[15px] font-semibold leading-5 ${
                  done
                    ? "bg-forest-900 text-ivory"
                    : active
                      ? "bg-gold-500 text-forest-900"
                      : "bg-sand text-forest-900"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`${active ? "inline" : "hidden sm:inline"} text-[15px] font-semibold leading-5 tracking-[0.2px] ${
                  i <= CURRENT_STEP ? "text-forest-900" : "text-ink-secondary"
                }`}
              >
                {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// The trip comes from the URL (?trip=...&travellers=...), so this reads request
// data and must sit inside <Suspense>.
async function CheckoutContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const trip = getTrip(sp.trip ?? "");
  if (!trip) redirect("/trips");

  const parsed = parseInt(sp.travellers ?? "2", 10);
  const travellers = Math.min(8, Math.max(1, Number.isNaN(parsed) ? 2 : parsed));

  return (
    <CheckoutForm trip={trip} travellers={travellers} image={getDetail(trip).gallery[0]} />
  );
}

export default function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <CheckoutHeader />

      <main>
        <Stepper />
        <Suspense fallback={<div className="min-h-[600px]" />}>
          <CheckoutContent searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
