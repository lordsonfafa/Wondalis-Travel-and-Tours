import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TripEditor } from "@/components/admin/TripEditor";
import { getEditorTrip } from "@/lib/data/admin-editor";

export const metadata: Metadata = { title: "Edit trip" };

// The slug comes from the URL, so this reads request data and must sit inside <Suspense>.
async function EditContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = getEditorTrip(slug);
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