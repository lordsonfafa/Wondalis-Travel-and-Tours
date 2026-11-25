import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { PayBalanceForm } from "@/components/PayBalanceForm";
import { requireCustomer } from "@/lib/auth-guards";
import { getMyBooking } from "@/lib/db/account";

export const metadata: Metadata = {
  title: "Pay balance",
  robots: { index: false, follow: false },
};

async function PayContent({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const user = await requireCustomer();
  const booking = await getMyBooking(user.id, ref); // null unless it is this customer's own booking
  if (!booking) notFound();
  // Nothing left to pay: send them back to the booking.
  if (booking.paidUsd >= booking.totalUsd) redirect(`/account/bookings/${ref}`);
  return <PayBalanceForm booking={booking} />;
}

export default function PayBalancePage({ params }: { params: Promise<{ ref: string }> }) {
  return (
    <>
      <Nav />
      <main>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <PayContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}