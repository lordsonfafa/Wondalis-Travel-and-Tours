import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsView } from "@/components/admin/SettingsView";
import { requireOwner } from "@/lib/auth-guards";
import { getSettings } from "@/lib/fx";
import { listTeam } from "@/lib/db/team";

export const metadata: Metadata = { title: "Settings" };

// Staff must not reach Settings (rate, payment methods, team). The check runs on the server,
// so hiding a link is never the only protection.
async function OwnerOnlySettings() {
  const me = await requireOwner();
  const [s, team] = await Promise.all([getSettings(), listTeam()]);
  return (
    <SettingsView
      team={team}
      meId={me.id}
      fx={{
        mode: s.fxMode,
        fixedRate: s.fixedRate.toNumber(),
        liveRate: s.liveRate?.toNumber() ?? null,
        liveRateUpdatedAt: s.liveRateUpdatedAt?.toISOString() ?? null,
      }}
    />
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px]" />}>
      <OwnerOnlySettings />
    </Suspense>
  );
}
