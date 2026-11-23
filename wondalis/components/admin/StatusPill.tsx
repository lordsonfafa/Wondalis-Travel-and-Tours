import type { PaymentStatus } from "@/lib/data/admin";

const styles: Record<PaymentStatus, string> = {
  Paid: "bg-[#e3f2e8] text-[#2e7d4f]",
  Partial: "bg-[#f5ebd4] text-forest-900",
  Due: "bg-[#fae5e0] text-kente-red",
  Cancelled: "bg-[#f0ebe0] text-ink-secondary",
};

/** Payment status pill used in admin tables. */
export function StatusPill({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-[5px] text-sm leading-5 ${styles[status]}`}>
      {status}
    </span>
  );
}