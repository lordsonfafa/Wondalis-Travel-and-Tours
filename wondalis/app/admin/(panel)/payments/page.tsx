import type { Metadata } from "next";
import { PaymentsView } from "@/components/admin/PaymentsView";
import { adminPayments, paymentKpis } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Payments" };

export default function AdminPaymentsPage() {
  return <PaymentsView kpis={paymentKpis} initial={adminPayments} />;
}