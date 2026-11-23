import type { Metadata } from "next";
import { TripEditor } from "@/components/admin/TripEditor";
import { emptyTrip } from "@/lib/data/admin-editor";

export const metadata: Metadata = { title: "New trip" };

export default function NewTripPage() {
  return <TripEditor initial={emptyTrip} mode="new" />;
}