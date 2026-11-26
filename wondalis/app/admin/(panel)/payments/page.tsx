import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentsView } from "@/components/admin/PaymentsView";
import { requireStaff } from "@/lib/auth-guards";
import { listAdminPayments } from "@/lib/db/admin-data";

export const metadata: Metadata = { title: "Payments" };

async function Content() {
  await requireStaff();
  const { payments, kpis } = await listAdminPayments();
  return <PaymentsView kpis={kpis} initial={payments} />;
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<p className="text-ink-secondary">Loading payments…</p>}>
      <Content />
    </Suspense>
  );
}
