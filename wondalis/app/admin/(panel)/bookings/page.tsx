import type { Metadata } from "next";
import { BookingsView } from "@/components/admin/BookingsView";
import { adminBookings } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Bookings" };

export default function AdminBookingsPage() {
  return <BookingsView initial={adminBookings} />;
}