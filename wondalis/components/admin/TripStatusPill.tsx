import type { TripStatus } from "@/lib/data/admin";

const styles: Record<TripStatus, string> = {
  Published: "bg-[#e3f2e8] text-[#2e7d4f]",
  Draft: "bg-[#f0ebe0] text-ink-secondary",
};

/** Published / Draft pill for the admin trips table. */
export function TripStatusPill({ status }: { status: TripStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-[5px] text-sm leading-5 ${styles[status]}`}>
      {status}
    </span>
  );
}