import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingsList } from "@/components/BookingsList";
import { EmptyBookings } from "@/components/EmptyBookings";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { bookings } from "@/lib/data/bookings";

// Account pages are private: keep them out of search results.
export const metadata: Metadata = {
  title: "My bookings",
  robots: { index: false, follow: false },
};

const gutter = "px-5 md:px-12 lg:px-24";

// Dummy-data helper: add ?state=empty to the URL to preview the empty state.
// Remove once real bookings come from the backend.
async function BookingsContent({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const list = state === "empty" ? [] : bookings;

  if (list.length === 0) return <EmptyBookings />;

  return (
    <div
      className={`mx-auto flex max-w-[1440px] flex-col gap-8 pb-20 pt-12 lg:pb-[120px] lg:pt-16 ${gutter}`}
    >
      <h1 className="animate-fade-up font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
        My bookings
      </h1>
      <BookingsList bookings={list} />
    </div>
  );
}

export default function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  return (
    <>
      <Nav />
      <main>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <BookingsContent searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
