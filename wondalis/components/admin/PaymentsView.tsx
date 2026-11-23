"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import type { AdminPayment, PaymentRecordStatus } from "@/lib/data/admin";
import { formatMoney, moneyCompact } from "@/lib/money";
import { useToast } from "./Toast";

const filters = ["All", "Paid", "Pending", "Failed"] as const;
type Filter = (typeof filters)[number];

const chipBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-[18px] py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors";

const pillCls: Record<PaymentRecordStatus, string> = {
  Paid: "bg-[#e3f2e8] text-[#2e7d4f]",
  Pending: "bg-[#f5ebd4] text-forest-900",
  Failed: "bg-[#fae5e0] text-kente-red",
};

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function PaymentsView({
  kpis,
  initial,
}: {
  kpis: { label: string; usd?: number; value?: string }[];
  initial: AdminPayment[];
}) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("All");

  const visible = initial.filter((p) => filter === "All" || p.status === filter);

  function exportCsv() {
    if (!visible.length) {
      toast("No payments to export", "error");
      return;
    }
    const header = ["Date", "Booking", "Customer", "Method", "Amount", "Currency", "Amount (USD)", "Status"];
    const rows = visible.map((p) => [p.date, p.ref, p.customer, p.method, formatMoney(p.amount, p.currency).primary, p.currency, p.amount, p.status]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "wondalis-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${visible.length} payment${visible.length === 1 ? "" : "s"}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-[32px] font-semibold leading-[40px] text-forest-900 lg:text-[40px] lg:leading-[48px]">
          Payments
        </h1>
        <Button variant="secondary" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-2 rounded-[20px] border border-border bg-white p-6">
            <p className="text-sm leading-5 text-ink-secondary">{k.label}</p>
            <p className="font-serif text-[40px] font-semibold leading-[48px] text-forest-900">{k.usd !== undefined ? moneyCompact(k.usd, "GHS") : k.value}</p>
          </div>
        ))}
      </div>

      <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0" role="group" aria-label="Filter by payment status">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`${chipBase} ${
              filter === f
                ? "bg-forest-900 text-ivory"
                : "border border-border bg-white text-forest-900 hover:border-forest-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[20px] border border-border bg-white px-6 py-2">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-border text-xs leading-4 tracking-[2px] text-ink-secondary">
              <th scope="col" className="py-3 pr-4 font-bold">DATE</th>
              <th scope="col" className="py-3 pr-4 font-bold">BOOKING</th>
              <th scope="col" className="py-3 pr-4 font-bold">CUSTOMER</th>
              <th scope="col" className="py-3 pr-4 font-bold">METHOD</th>
              <th scope="col" className="py-3 pr-4 font-bold">AMOUNT</th>
              <th scope="col" className="py-3 font-bold">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-base text-ink-secondary">
                  No {filter.toLowerCase()} payments.
                </td>
              </tr>
            ) : (
              visible.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0">
                  <td className="whitespace-nowrap py-3.5 pr-4 text-base text-ink">{p.date}</td>
                  <td className="whitespace-nowrap py-3.5 pr-4 text-base text-ink">{p.ref}</td>
                  <td className="whitespace-nowrap py-3.5 pr-4 text-base text-ink">{p.customer}</td>
                  <td className="whitespace-nowrap py-3.5 pr-4 text-base text-ink">{p.method}</td>
                  <td className="whitespace-nowrap py-3.5 pr-4">
                    <span className="block text-base text-ink">{formatMoney(p.amount, p.currency).primary}</span>
                    <span className="block text-sm text-ink-secondary">{formatMoney(p.amount, p.currency).secondary}</span>
                  </td>
                  <td className="py-3.5">
                    <span className={`rounded-full px-3 py-[5px] text-sm leading-5 ${pillCls[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}