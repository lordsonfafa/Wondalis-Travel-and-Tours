import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsView } from "@/components/admin/SettingsView";
import { requireOwner } from "@/lib/auth-guards";

export const metadata: Metadata = { title: "Settings" };

// Staff must not reach Settings (rate, payment methods, team). The check runs on the server,
// so hiding a link is never the only protection.
async function OwnerOnlySettings() {
  await requireOwner();
  return <SettingsView />;
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px]" />}>
      <OwnerOnlySettings />
    </Suspense>
  );
}
