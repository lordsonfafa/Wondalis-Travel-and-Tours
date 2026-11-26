import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingsList } from "@/components/BookingsList";
import { EmptyBookings } from "@/components/EmptyBookings";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";
import { requireCustomer } from "@/lib/auth-guards";
import { getMyBookings } from "@/lib/db/account";

// Account pages are private: keep them out of search results.
export const metadata: Metadata = {
  title: "My bookings",
  robots: { index: false, follow: false },
};

const gutter = "px-5 md:px-12 lg:px-24";

// Reads the session cookie, so it sits inside <Suspense>. The query is filtered by the signed-in
// user's id: a customer can only ever see their own bookings.
async function BookingsContent() {
  const user = await requireCustomer();
  const list = await getMyBookings(user.id);

  const banner = user.emailVerified ? null : (
    <div className={`mx-auto max-w-[1440px] pt-8 ${gutter}`}>
      <VerifyEmailBanner email={user.email} />
    </div>
  );

  if (list.length === 0) {
    return (
      <>
        {banner}
        <EmptyBookings />
      </>
    );
  }

  return (
    <>
      {banner}
      <div
        className={`mx-auto flex max-w-[1440px] flex-col gap-8 pb-20 pt-12 lg:pb-[120px] lg:pt-16 ${gutter}`}
      >
        <h1 className="animate-fade-up font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
          My bookings
        </h1>
        <BookingsList bookings={list} />
      </div>
    </>
  );
}

export default function MyBookingsPage() {
  return (
    <>
      <Nav />
      <main>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <BookingsContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
