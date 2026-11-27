import type { QuoteView } from "@/lib/quotes";

const labels: Record<QuoteView, string> = {
  waiting: "Needs a price",
  quoted: "Quoted",
  expired: "Expired",
  paying: "Paying",
  paid: "Paid",
  declined: "Declined",
  cancelled: "Cancelled",
};
const tone: Record<QuoteView, string> = {
  waiting: "bg-gold-100 text-forest-900",
  quoted: "bg-sand text-forest-900",
  expired: "bg-sand text-ink-secondary",
  paying: "bg-sand text-forest-900",
  paid: "bg-[#e3f1e8] text-[#2e7d4f]",
  declined: "bg-sand text-ink-secondary",
  cancelled: "bg-sand text-ink-secondary",
};

export const RequestPill = ({ view }: { view: QuoteView }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${tone[view]}`}>{labels[view]}</span>
);
