"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import type { AdminCustomer } from "@/lib/data/admin";
import { useToast } from "./Toast";

const filters = ["All", "Diaspora", "In Ghana"] as const;
type Filter = (typeof filters)[number];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const chipBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-[18px] py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors";

const cols = "grid grid-cols-[250px_150px_100px_110px_110px_240px] items-center";

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function CustomersView({ initial }: { initial: AdminCustomer[] }) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = initial.filter((c) => {
    const inGhana = c.country === "Ghana";
    if (filter === "Diaspora" && inGhana) return false;
    if (filter === "In Ghana" && !inGhana) return false;
    return !q || [c.name, c.country, c.latestTrip].some((v) => v.toLowerCase().includes(q));
  });

  function exportCsv() {
    if (!visible.length) {
      toast("No customers to export", "error");
      return;
    }
    const header = ["Customer", "Country", "Bookings", "Paid (USD)", "Balance (USD)", "Latest trip"];
    const rows = visible.map((c) => [c.name, c.country, c.bookings, c.paid, c.balance, c.latestTrip]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "wondalis-customers.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${visible.length} customer${visible.length === 1 ? "" : "s"}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="hidden font-serif text-[32px] font-semibold leading-[40px] text-forest-900 lg:block lg:text-[40px] lg:leading-[48px]">
          Customers
        </h1>
        <Button variant="secondary" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter customers">
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
        <label className="flex w-full items-center gap-2.5 rounded-full border border-border bg-white px-[18px] py-3 text-base text-ink-secondary sm:w-[280px]">
          <span aria-hidden>⌕</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers"
            aria-label="Search customers"
            className="w-full bg-transparent text-ink outline-none placeholder:text-ink-secondary"
          />
        </label>
      </div>

      {/* Phones: one card per customer. The table shows from md up. */}
      <ul className="flex flex-col gap-3.5 md:hidden">
        {visible.map((c) => (
          <li key={c.name} className="flex flex-col gap-3 rounded-[20px] border border-border bg-white p-[17px]">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[15px] font-semibold text-forest-900">
                {c.name[0]}
              </span>
              <span className="flex flex-col">
                <span className="text-xl font-semibold leading-7 text-forest-900">{c.name}</span>
                <span className="text-sm leading-5 text-ink-secondary">
                  {c.country} · {c.bookings} {c.bookings === 1 ? "booking" : "bookings"}
                </span>
              </span>
            </div>
            <p className="text-base text-ink">
              Paid {usd(c.paid)} · Balance {usd(c.balance)}
            </p>
            <p className="text-sm text-ink-secondary">{c.latestTrip}</p>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-10 text-center text-ink-secondary">No customers match your search.</li>
        )}
      </ul>

      <div className="hidden overflow-x-auto rounded-[20px] border border-border bg-white md:block">
        <div role="table" aria-label="Customers" className="min-w-[1020px] px-6 py-2">
          <div role="row" className={`${cols} py-3 text-xs font-bold leading-4 tracking-[2px] text-ink-secondary`}>
            <span role="columnheader">CUSTOMER</span>
            <span role="columnheader">COUNTRY</span>
            <span role="columnheader">BOOKINGS</span>
            <span role="columnheader">PAID</span>
            <span role="columnheader">BALANCE</span>
            <span role="columnheader">LATEST TRIP</span>
          </div>
          {visible.length === 0 ? (
            <p className="border-t border-border py-10 text-center text-base text-ink-secondary">
              No customers match your search.
            </p>
          ) : (
            visible.map((c) => (
              <div role="row" key={c.name} className={`${cols} border-t border-border py-3.5 text-base text-ink`}>
                <div role="cell" className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[15px] font-semibold text-forest-900">
                    {c.name[0]}
                  </span>
                  <span className="text-xl font-semibold leading-7 text-forest-900">{c.name}</span>
                </div>
                <span role="cell">{c.country}</span>
                <span role="cell">{c.bookings}</span>
                <span role="cell">{usd(c.paid)}</span>
                <span role="cell">{usd(c.balance)}</span>
                <span role="cell">{c.latestTrip}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}