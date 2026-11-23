import type { Metadata } from "next";
import { CustomersView } from "@/components/admin/CustomersView";
import { adminCustomers } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return <CustomersView initial={adminCustomers} />;
}