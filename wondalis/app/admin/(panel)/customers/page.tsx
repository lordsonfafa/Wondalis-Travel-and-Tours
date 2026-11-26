import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomersView } from "@/components/admin/CustomersView";
import { requireStaff } from "@/lib/auth-guards";
import { listAdminCustomers } from "@/lib/db/admin-data";

export const metadata: Metadata = { title: "Customers" };

async function Content() {
  await requireStaff();
  return <CustomersView initial={await listAdminCustomers()} />;
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<p className="text-ink-secondary">Loading customers…</p>}>
      <Content />
    </Suspense>
  );
}
