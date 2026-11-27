import type { Metadata } from "next";
import { Suspense } from "react";
import { PlacesView } from "@/components/admin/PlacesView";
import { requireStaff } from "@/lib/auth-guards";
import { listAllPlaces } from "@/lib/db/places";

export const metadata: Metadata = { title: "Places" };

async function Content() {
  await requireStaff();
  return <PlacesView initial={await listAllPlaces()} />;
}

export default function AdminPlacesPage() {
  return (
    <Suspense fallback={<p className="text-ink-secondary">Loading places…</p>}>
      <Content />
    </Suspense>
  );
}
