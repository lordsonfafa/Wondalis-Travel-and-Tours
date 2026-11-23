import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/Button";
import { CheckoutHeader } from "@/components/CheckoutHeader";
import { Footer } from "@/components/Footer";
import { getTrip } from "@/lib/data/trips";

// Private page: keep it out of search results.
export const metadata: Metadata = {
  title: "Payment did not go through",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ trip?: string; travellers?: string }>;

// Reads the URL, so it sits inside <Suspense>. The backend will redirect here
// when the payment gateway reports a failure, passing the same trip and travellers.
async function FailedContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const trip = getTrip(sp.trip ?? "");
  // Send them back to the same checkout, or to the trips list if we do not know it.
  const retryHref = trip
    ? `/checkout?trip=${trip.slug}&travellers=${encodeURIComponent(sp.travellers ?? "2")}`
    : "/trips";

  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-8 px-5 pb-24 pt-20 text-center md:px-12 lg:px-24 lg:pb-40 lg:pt-[140px]"
    >
      <div
        aria-hidden
        className="flex size-24 items-center justify-center rounded-full bg-[#fae5e0] font-serif text-[40px] font-semibold leading-[48px] text-kente-red"
      >
        !
      </div>
      <h1 className="animate-fade-up font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900 lg:text-[56px] lg:leading-[64px]">
        Payment did not go through
      </h1>
      <p className="text-lg leading-7 text-ink-secondary">No money was taken.</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button href={retryHref}>Try again</Button>
        <Button href={retryHref} variant="secondary">
          Use another method
        </Button>
      </div>
    </section>
  );
}

export default function PaymentFailedPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <CheckoutHeader />
      <main>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <FailedContent searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
