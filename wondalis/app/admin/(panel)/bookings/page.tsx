import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingsView } from "@/components/admin/BookingsView";
import { requireStaff } from "@/lib/auth-guards";
import { listAdminBookings } from "@/lib/db/admin-data";

export const metadata: Metadata = { title: "Bookings" };

async function Content() {
  await requireStaff();
  return <BookingsView initial={await listAdminBookings()} />;
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<p className="text-ink-secondary">Loading bookings…</p>}>
      <Content />
    </Suspense>
  );
}
