import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TripEditor } from "@/components/admin/TripEditor";
import { requireStaff } from "@/lib/auth-guards";
import { getEditorTrip } from "@/lib/db/admin-trips";

export const metadata: Metadata = { title: "Edit trip" };

// The slug comes from the URL, so this reads request data and must sit inside <Suspense>.
async function EditContent({ params }: { params: Promise<{ slug: string }> }) {
  await requireStaff(); // drafts must never be readable without a staff session
  const { slug } = await params;
  const trip = await getEditorTrip(slug);
  if (!trip) notFound();
  return <TripEditor key={slug} initial={trip} mode="edit" />;
}

export default function EditTripPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <EditContent params={params} />
    </Suspense>
  );
}